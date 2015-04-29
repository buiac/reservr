/* reservr
 */

(function(global) {

  // init foundation
  $(document).foundation({
    orbit: {
      navigation_arrows: true,
      slide_number: false,
      bullets: false,
      swipe: true,
      timer_speed: 5000,
      circular: true,
      resume_on_mouseout: true
    }
  });
  
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
  
  
})(this);


