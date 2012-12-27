(function() {

  return {

    defaultState: 'loading',
    searchType: {
      ticket: true,
      comment: false,
      user: false,
      organization: false,
      group: false,
      entry: false
    },

    events: {
      'app.activated': 'init',
      'searchDesk.done': 'handleResults',
      'searchDesk.fail': 'handleFail',
      'getUsers.done': 'handleUsers',
      'click .options a': 'toggleAdvanced',
      'click .suggestion': 'suggestionClicked',
      'click .search-icon': 'doTheSearch',
      'keydown .search-box': 'handleKeydown'
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

      searchDesk: function(data) {
        return {
          url: '/api/v2/search.json?query=' + data,
          type: 'GET'
        };
      }

    },

    init: function(data) {
      if(!data.firstLoad){
        return;
      }

      this.allRequiredPropertiesExist();

      this.switchTo('search', { searchSuggestions: this.loadSearchSuggestions() });
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
      this.$('.search-box').val(this.$(e.target).text());

      this.doTheSearch();

      return false;
    },

    toggleAdvanced: function(e){
      var $advancedOptions = this.$('.advanced-options');
      if($advancedOptions.is(':hidden')){
        this.$('.options .basic').show();
        this.$('.options .advanced').hide();

        // Load users when advanced is clicked
        this.ajax('getUsers');

        $advancedOptions.slideDown();
      } else {
        $advancedOptions.slideUp();
        this.$('.options .advanced').show();
        this.$('.options .basic').hide();
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
      var searchType = this._updateSearchType( $search.find('#type').val() );
      var searchTerm = $search.find('.search-box').val();

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

      return helpers.fmt('type:%@ %@ %@', searchType, searchTerm, params.join(" "));
    },

    doTheSearch: function(){

      this.$('.results').empty();
      this.$('.searching').show();

      this.ajax('searchDesk', this.searchParams() );

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

    allRequiredPropertiesExist: function() {
      if (this.requiredProperties.length > 0) {
        var valid = this.validateRequiredProperty(this.requiredProperties[0]);

        // prop is valid, remove from array
        if (valid) {
          this.requiredProperties.shift();
        }

        if (this.requiredProperties.length > 0 && this.currAttempt < this.MAX_ATTEMPTS) {
          if (!valid) {
            ++this.currAttempt;
          }

          _.delay(_.bind(this.allRequiredPropertiesExist, this), 100);
          return;
        }
      }

      if (this.currAttempt < this.MAX_ATTEMPTS) {
        this.trigger('requiredProperties.ready');
      } else {
        this.showError(null, this.I18n.t('global.error.data'));
      }
    },

    validateRequiredProperty: function(property) {
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
    },

    handleKeydown: function(e){
      if (e.which === 13) {
        this.doTheSearch();
        return false;
      }
    },

    handleResults: function (data) {
      var results = data.results;
      if ( results.length > 10 ) {
        results = results.slice(0, 10);
      }

      var ticketId = this.ticket().id();

      // remove current ticket from results
      results = _.reject(results, function(result) {
        return result.result_type === "ticket" && result.id === ticketId;
      });

      var resultsTemplate = this.renderTemplate('results', { results: results, searchType: this.searchType } );

      this.$('.searching').hide();
      this.$('.results').html(resultsTemplate);
    },

    handleFail: function ( ) {
      this.$('.searching').hide();
      this.$('.results').html( this.renderTemplate('error') );
    },

    _updateSearchType: function(newSearchType){
      _.each(this.searchType, function(val, key){
        if ( key === newSearchType ) {
          this.searchType[key] = true;
        } else {
          this.searchType[key] = false;
        }
      }, this);
      return newSearchType;
    }

  };

}());