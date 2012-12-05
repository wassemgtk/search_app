(function() {

  return {

    events: {
      'app.activated': 'displaySearch',
      'click .searchbutton': 'doTheSearch'
      'mouseover .tips': 'showToolTip' */
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
      var endDescription = 0;

      if (descOperator === "plus") {
        endDescription = "+" + getDescription.replace ( / /g, " +");
      console.log(endDescription);
      this.ajax ('searchDesk',endDescription);
      } else if (descOperator === "minus") {
        endDescription = "-" + getDescription.replace ( / /g, " -");
      console.log(endDescription);
      this.ajax ('searchDesk',endDescription);
      } else {
        endDescription = getDescription;
      console.log(endDescription);
      this.ajax ('searchDesk',endDescription);
      }
  


     var data = 'type:ticket' + ' ' + status + ' ' + priority + ' ' + endDescription;
     this.ajax('searchDesk',data);
   },

   showToolTip: function () {
    this.$('.tooltip').fadeTo('slow',1);
   }



  };

}());