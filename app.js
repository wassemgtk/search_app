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
      'click .options a': 'toggleAdvanced',
      'click .suggestion': 'suggestionClicked',
      'click .search-icon': 'doTheSearch',
      'keydown .search-box': 'handleKeydown'
    },

    requests: {

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
        $advancedOptions.slideDown();
      } else {
        $advancedOptions.slideUp();
        this.$('.options .advanced').show();
        this.$('.options .basic').hide();
      }
    },

    searchParams: function(){
      var $search = this.$('.search');
      var params = "";
      var searchType = this._updateSearchType( $search.find('#type').val() );
      var searchTerm = $search.find('.search-box').val();

      return helpers.fmt('type:%@ %@ %@', searchType, searchTerm, params);
    },

    doTheSearch: function(){

      this.$('.results').empty();
      this.$('.searching').show();

      this.ajax('searchDesk', this.searchParams() );

    },

    handleKeydown: function(e){
      if (e.which === 13) {
        this.doTheSearch();
        return false;
      }
    },

    handleResults: function (data) {
      var results = this.renderTemplate('results', { results: data.results, searchType: this.searchType } );

      this.$('.searching').hide();
      this.$('.results').html(results);
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
    },

    showToolTip: function () {
      this.$('.tooltip').fadeIn('fast');
      console.log("mouse goes in");
    },

    hideToolTip: function () {
      this.$('.tooltip').fadeOut('fast');
      console.log("mouse goes out 49 ");
    },

    fadeSearchUp: function () {
      this.$('.searchbutton').fadeTo('fast',1);
      console.log("mouse goes in search");
    },

    fadeSearchDown: function () {
      this.$('.searchbutton').fadeTo('fast',0.5);
      console.log("mouse goes out search ");
    },

    fadebackUp: function () {
      this.$('.backsearchbutton').fadeTo('fast',1);
      console.log("mouse goes in back");
    },

    fadebackDown: function () {
      this.$('.backsearchbutton').fadeTo('fast',0.5);
      console.log("mouse goes out back ");
    },

    getBackToSearch: function () {
      this.switchTo('list');
    }

  };

}());