(function() {

  return {

    events: {
      'app.activated': 'displaySearch',
      'click .searchbutton': 'doTheSearch'
    },
    
    requests: {

      searchDesk: function(data) {
        return {
          url: '/api/v2/search.json?query=' + data,
          type: 'GET'
        };
      }

    },

    displaySearch: function() {
      this.switchTo('list');
    },

    'searchDesk.always': function(data) {
      services.notify(data.responseText);
    },

   doTheSearch: function(){
     var status = 'status'+this.$('#status_operator').val() + this.$('#status').val();
     console.log(status);
     this.ajax ('searchDesk',status);

     var priority = 'priority'+this.$('#priority_operator').val() + this.$('#priority').val();
     console.log(priority);
     this.ajax ('searchDesk',priority);

     var data = status + ' ' + priority;
     this.ajax('searchDesk',data);
   }




      
     

  };

}());