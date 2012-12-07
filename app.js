(function() {

  return {

    data: '',
    listArray: [],

    events: {
      'app.activated': 'displaySearch',
      'click .searchbutton': 'doTheSearch',
      'mouseenter .tips': 'showToolTip',
      'mouseleave .tips': 'hideToolTip',
      'searchDesk.done': function(data) {
      /* services.notify(data.results); */
      _.each(data.results, this.list, this);
    }
    },

    list: function(item) { 
      // services.notify('#' + item.id + ' ' + item.subject);
      this.listArray.push({'id': '' + item.id + '','test': + '' + item.subject + ''});
      this.displaySearch();
      console.log(1234);
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
      this.switchTo('list', {
        listArray: this.listArray
      });
    },

    

   doTheSearch: function(){


    var status = null;

    if (this.$('#status').val() != 'none') {
           status = 'status'+this.$('#status_operator').val() + this.$('#status').val();
     console.log(status);
     
    } else {
           status = null;
    }

    var priority = null;

    if (this.$('#piority').val() != 'none') {
      priority = 'priority'+this.$('#priority_operator').val() + this.$('#priority').val();
      console.log(priority);
    } else {
      priority = null;
    }     


     var dateRange = this.$('#date_action_operator').val() + '>' + this.$('#from_date').val() + ' ' + this.$('#date_action_operator').val() + '<' + this.$('#to_date').val();
     console.log(dateRange);
     


     

      var getDescription = this.$('#description').val();
      var descOperator = this.$('#text_operator').val();
      var endDescription = 0;

      if (descOperator === "plus") {
        endDescription = "+" + getDescription.replace ( / /g, " +");
      console.log(endDescription);
      
      } else if (descOperator === "minus") {
        endDescription = "-" + getDescription.replace ( / /g, " -");
      console.log(endDescription);
      
      } else {
        endDescription = getDescription;
      console.log(endDescription);
      }
  


     this.data = 'type:ticket' + ' ' + status + ' ' + priority + ' ' + dateRange + ' ' + endDescription;
     this.runSearchNow();
   },

   showToolTip: function () {
    this.$('.tooltip').fadeIn('fast');
    console.log("mouse goes in");
   },

   hideToolTip: function () {
    this.$('.tooltip').fadeOut('fast');
    console.log("mouse goes out 20 ");   
   }, 

   runSearchNow: function () {
    this.ajax('searchDesk',this.data);
   }



  };

}());