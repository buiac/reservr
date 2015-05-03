/* reservr
 */

(function(global) {

  // init foundation
  $(document).foundation();
  
  // toggle full description
  var toggleDescription = function() {
    
    var $this = $(this);
    var $description = $this.prev('.event-description');
    
    $description.toggleClass('event-description--show');
    
  };
  
  $('.event-toggle-description').on('click', toggleDescription);
  
  
  // show reservation box
  var toggleReservationBox = function() {
    
    var $container = $(this).parent('.container-reserve');
    
    $container.toggleClass('container-reserve--active');

  };
  
  $('.container-reserve-btn').on('click', toggleReservationBox);
  
  
  var submitReserveForm = function() {
    
    var $this = $(this);
    var email = $this.find('.reserve-email').val();
    var seats = $this.find('.reserve-seats').val();
    var eventId = $this.find('.reserve-id').val();
    
    $this.removeClass('container-reserve-form--success container-reserve-form--error');
    
    $this.addClass('container-reserve-form--loading');
    
    $.ajax('/reservations/' + eventId, {
      type: 'POST',
      data: {
        email: email,
        seats: seats
      },
      success: function(res) {
        
        $this.addClass('container-reserve-form--success');
        
      },
      error: function(err) {
        
        $this.addClass('container-reserve-form--error');
        
        // allow me to try again 
        setTimeout(function() {
          
          $this.removeClass('container-reserve-form--error');
          
        }, 5000);
        
      },
      complete: function() {
       
        $this.removeClass('container-reserve-form--loading');
        
      }
    });
    
    return false;
    
  };

  var submitReserveForm = function() {
    
    var $this = $(this);
    var email = $this.find('.reserve-email').val();
    var seats = $this.find('.reserve-seats').val();
    var eventId = $this.find('.reserve-id').val();
    var waiting = $this.find('.reserve-waiting').val();
    
    $this.removeClass('container-reserve-form--success container-reserve-form--error');
    
    $this.addClass('container-reserve-form--loading');
    
    $.ajax('/reservations/' + eventId, {
      type: 'POST',
      data: {
        email: email,
        seats: seats,
        waiting: waiting
      },
      success: function(res) {
        
        $this.addClass('container-reserve-form--success');
        
      },
      error: function(err) {
        
        $this.addClass('container-reserve-form--error');
        
        // allow me to try again 
        setTimeout(function() {
          
          $this.removeClass('container-reserve-form--error');
          
        }, 5000);
        
      },
      complete: function() {
       
        $this.removeClass('container-reserve-form--loading');
        
      }
    });
    
    return false;
    
  };
  
  $('.container-reserve form').on('submit', submitReserveForm);
  
  
})(this);


