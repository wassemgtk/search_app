(function() {

  return {

    per_page: 10,

    currAttempt: 0,
    MAX_ATTEMPTS: 20,

    defaultState: 'loading',

    events: {
      'app.activated': 'init',
      'searchDesk.done': 'handleResults',
      'searchDesk.fail': 'handleFail',
      'getUsers.done': 'handleUsers',
      'click .options a': 'toggleAdvanced',
      'click .suggestion': 'suggestionClicked',
      'click .search-icon': 'doTheSearch',
      'click .page': 'handleChangePage',
      'keydown .search-box': 'handleKeydown',
      'requiredProperties.ready': 'handleRequiredProperties'
    },

    requiredProperties : [
      'ticket.id',
      'ticket.subject'
    ],

    requests: {

      getUsers: function(data) {
        return {
          url: '/api/v2/users.json',
          type: 'GET'
        };
      },

      searchDesk: function(params) {
        return {
          url: params.pageUrl || helpers.fmt('/api/v2/search.json?per_page=%@&query=%@', this.per_page, params.query),
          type: 'GET'
        };
      }

    },

    init: function(data) {
      if(!data.firstLoad){
        return;
      }

      this._allRequiredPropertiesExist();
    },

    loadSearchSuggestions: function(){
      if (_.isUndefined(this.settings.custom_fields)){
        return [];
      }
      var customFieldIDs = this.settings.custom_fields.match(/\d+/g);
      var searchSuggestions = [];

      _.each(customFieldIDs, function(customFieldID){

        var customFieldName = 'custom_field_' + customFieldID;
        var customFieldValue = this.ticket().customField(customFieldName);

        if ( customFieldValue ) {
          searchSuggestions.push( customFieldValue );
        }

      }, this);

      return searchSuggestions;

    },

    suggestionClicked: function(e){
      var $searchBox = this.$('.search-box');
      $searchBox.val( $searchBox.val() + ' ' + this.$(e.target).text() );

      this.doTheSearch();

      return false;
    },

    toggleAdvanced: function(e){
      var $advancedOptions = this.$('.advanced-options-wrapper');
      if($advancedOptions.is(':hidden')){
        this.$('.options .basic').show();
        this.$('.options .advanced').hide();

        // Load users when advanced is clicked
        this.ajax('getUsers');

        $advancedOptions.slideDown();
        $advancedOptions.addClass('visible');
      } else {
        $advancedOptions.slideUp();
        this.$('.options .advanced').show();
        this.$('.options .basic').hide();
        $advancedOptions.removeClass('visible');
      }
    },

    handleUsers: function(data) {
      var agents = [];
      var options = '<option value="">-</option>';

      agents = _.reject(data.users, function(user) {
        return user.role !== 'admin' && user.role !== 'agent';
      });

      // populate the assignee drop down
      _.each(agents, function(agent) {
          options += '<option value="' + agent.name + '">' + agent.name + '</option>';
      });

      this.$('#assignee').html(options);
    },

    searchParams: function(){
      var $search = this.$('.search');
      var params = [];
      var searchType = $search.find('#type').val();
      var searchTerm = $search.find('.search-box').val();

      if (searchType !== "all") {
        params.push( helpers.fmt('type:%@', searchType) );
      }

      if ( this.$('.advanced-options').is(':visible') ) {

        // Status
        var filter = $search.find('#filter').val();
        var condition = $search.find('#condition').val();
        var value = $search.find('#value').val();

        if ( filter && condition && value ) {
          params.push( helpers.fmt('%@%@%@', filter, condition, value) );
        }

        // Created
        var range = $search.find('#range').val();
        var from = $search.find('#from').val();
        var to = $search.find('#to').val();

        if ( range && (from || to) ) {
          if (from) {
            params.push( helpers.fmt('%@>%@', range, from) );
          }
          if (to) {
            params.push( helpers.fmt('%@<%@', range, to) );
          }
        }

        // Assignee
        var assignee = $search.find('#assignee').val();

        if (assignee) {
          params.push( helpers.fmt('assignee:"%@"', assignee) );
        }

      }

      return helpers.fmt('%@ %@', searchTerm, params.join(" "));
    },

    doTheSearch: function(){
      this.$('.results').empty();
      this.$('.searching').show();

      // encodeURIComponent is used here to force IE to encode all characters
      this.ajax('searchDesk', { query: encodeURIComponent(this.searchParams()) });
    },

    extractKeywords: function(text) {
      // strip punctuation and extra spaces
      text = text.toLowerCase().replace(/[\.,-\/#!$?%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");

      // split by spaces
      var words = text.split(" ");

      var exclusions = this.I18n.t('stopwords.exclusions').split(",");

      var keywords = _.difference(words, exclusions);

      return keywords;
    },

    handleKeydown: function(e){
      if (e.which === 13) {
        this.doTheSearch();
        return false;
      }
    },

    handleChangePage: function(e){
      this.$('.results').empty();
      this.$('.searching').show();

      this.ajax('searchDesk', { pageUrl: this.$(e.target).data('url') });
    },

    handleResults: function (data) {
      var ticketId = this.ticket().id();

      _.each(data.results, function(result, index) {
        result["is_" + result.result_type] = true;

        // format descriptions
        if (result.is_ticket) {
          // remove current ticket from results
          if (result.id === ticketId) data.results.splice(index,1);
          result.description = result.description.substr(0,300).concat("...");
        }
        else if (this.is_topic) {
          result.body = result.body.substr(0,300).concat("...");
        }

      });

      data.count = this.I18n.t('search.results', { count: data.count });
      var resultsTemplate = this.renderTemplate('results', data);

      this.$('.searching').hide();
      this.$('.results').html(resultsTemplate);
    },

    handleRequiredProperties: function() {
      var keywords;
      var searchSuggestions = this.loadSearchSuggestions();

      if ( this.settings.related_tickets ) {
        keywords = this.extractKeywords(this.ticket().subject()).join(" ");
        searchSuggestions = searchSuggestions.concat(keywords);
      }

      this.switchTo('search', { searchSuggestions: searchSuggestions });
    },

    handleFail: function (data) {
      var response = JSON.parse(data.responseText);

      var error = { 
        title: this.I18n.t('global.error.title'),
        message: response.description || this.I18n.t('global.error.message')
      };

      var errorTemplate = this.renderTemplate('error', error);

      this.$('.searching').hide();
      this.$('.results').html(errorTemplate);
    },

    showError: function(title, msg) {
      this.switchTo('error', {
        title: title || this.I18n.t('global.error.title'),
        message: msg || this.I18n.t('global.error.message')
      });
    },

    _allRequiredPropertiesExist: function() {
      if (this.requiredProperties.length > 0) {
        var valid = this._validateRequiredProperty(this.requiredProperties[0]);

        // prop is valid, remove from array
        if (valid) {
          this.requiredProperties.shift();
        }

        if (this.requiredProperties.length > 0 && this.currAttempt < this.MAX_ATTEMPTS) {
          if (!valid) {
            ++this.currAttempt;
          }

          _.delay(_.bind(this._allRequiredPropertiesExist, this), 100);
          return;
        }
      }

      if (this.currAttempt < this.MAX_ATTEMPTS) {
        this.trigger('requiredProperties.ready');
      } else {
        this.showError(null, this.I18n.t('global.error.data'));
      }
    },

    _validateRequiredProperty: function(property) {
      var parts = property.split('.');
      var part = '', obj = this;

      while (parts.length) {
        part = parts.shift();
        try {
          obj = obj[part]();
        } catch (e) {
          return false;
        }
        // check if property is invalid
        if (parts.length > 0 && !_.isObject(obj)) {
          return false;
        }
        // check if value returned from property is invalid
        if (parts.length === 0 && (_.isNull(obj) || _.isUndefined(obj) || obj === '' || obj === 'no')) {
          return false;
        }
      }

      return true;
    }

  };

}());