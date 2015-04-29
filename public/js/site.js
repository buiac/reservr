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
    var name = $this.find('.reserve-name').val();
    var phone = $this.find('.reserve-phone').val();
    
    $this.removeClass('container-reserve-form--success container-reserve-form--error');
    
    $this.addClass('container-reserve-form--loading');
    
    $.ajax('/', {
      type: 'POST',
      data: {
        name: name,
        phone: phone
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


