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

     

      var getDescription = this.$('#description').val();
      var descOperator = this.$('#text_operator').val();
      

      if (descOperator === "plus") {
        var endDescription1 = "+" + getDescription.replace ( / /g, " +");
      console.log(endDescription1);
      this.ajax ('searchDesk',endDescription1);
      } else if (descOperator === "minus") {
        var endDescription2 = "-" + getDescription.replace ( / /g, " -");
      console.log(endDescription2);
      this.ajax ('searchDesk',endDescription2);
      } else {
        var endDescription3 = getDescription;
      console.log(endDescription3);
      this.ajax ('searchDesk',endDescription3);
      }
  


     var data = 'type:ticket' + ' ' + status + ' ' + priority; 
     this.ajax('searchDesk',data);
   }

  };

}());