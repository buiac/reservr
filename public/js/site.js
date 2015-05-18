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
    var email = $this.find('.reserve-email').val();
    var seats = $this.find('.reserve-seats').val();
    var eventId = $this.find('.reserve-id').val();
    var mclistid = $this.find('.reserve-newsletter').val();

    // send nothing if user does not check checkbox
    if (!$this.find('.reserve-newsletter')[0].checked) {
      mclistid = '';
    }
    
    $this.removeClass('container-reserve-form--success container-reserve-form--error');
    
    $this.addClass('container-reserve-form--loading');
    
    $.ajax('/reservations/' + eventId, {
      type: 'POST',
      data: {
        name: name,
        email: email,
        seats: seats,
        mclistid: mclistid
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


  var sc = $('.seat-map').seatCharts({
          map: [
              'aaaaa__aaaaaa',
              'aaaaa__aaaaaa',
              'aaaaa__aaaaa',
              '____________',
              '____________',
              'aaaaa__aaaaa',
              'aaaaa__aaaaa',
              'aaaaa__aaaaa',
          ],
          seats: {
              a: {
                  price   : 99.99,
                  classes : 'front-seat' //your custom CSS class
              }

          },
          click: function () {
            console.log(this.settings);
              if (this.status() == 'available') {
                  //do some stuff, i.e. add to the cart
                  return 'selected';
              } else if (this.status() == 'selected') {
                  //seat has been vacated
                  return 'available';
              } else if (this.status() == 'unavailable') {
                  //seat has been already booked
                  return 'unavailable';
              } else {
                  return this.style();
              }
          }
      });

      
  
  
  
})(this);


