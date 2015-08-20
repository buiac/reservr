/* reservr
 */

(function(global) {

  // init foundation
  $(document).foundation();
  
  var $datePicker = document.querySelector('.event-date');
  
  if($datePicker) {
  
    // init rome datetime picker
    rome($datePicker, {
      weekStart: 1
    });
  
  };
  
  $('.btn-delete-image').on('click', function(e) {
    e.stopPropagation();
  });

  // add a radio input to the image list. trying to select a default image
  // for the event
  $('.event-images li').each(function (i, li) {

    var input = $('<input type="radio" name="activeImage" value="' + i + '" class="image-default image-' + i + '" />');
    
    // search for a selected class on the li element
    if($(li).hasClass('active-image')){

      input.attr('checked', 'true');

    }

    $(li).append(input);
  
  });

  // if the image list has no active class, select the first
  if(!$('.event-images li.active-image').length) {
    $('.event-images li:first').addClass('active-image');
    $('.event-images li:first').find('input').attr('checked', 'true');
  }

  $('.image-default').on('click', function (e) {
    e.stopPropagation();

    $('.event-images li').removeClass('active-image');
    $(this).parent().addClass('active-image');

  });


  // alert user before he deletes an event in dashboard
  $('a.alert').click(function (e) {
    
    e.preventDefault();

    var conf = confirm("Are you sure you want to cancel?");

    if (conf === true) {
      window.location.href = 'http://' + window.location.host + $(this).attr('href');
    } 

  });

  // Allow user to update number of reserved seats
  var submitUpdateReservationForm = function (e) {
    
    e.preventDefault();

    var $this = $(this);
    var reservationId = $this.find('.reserve-rid').val();
    var seats = $this.find('.reserve-seats').val();
    var eventId = $this.find('.reserve-event-id').val();

    // show loading
    $('.reservation-form-wrap').addClass('reservation-form--loading');


    setTimeout(function () {
      $.ajax('/reservations/userview/' + reservationId, {
        type: 'POST',
        data: {
          reservationId: reservationId,
          eventId: eventId,
          seats: seats
        },
        success: function(res) {

          $('.reservation-form-wrap').attr('class','reservation-form-wrap reservation-form--hide')
          
        },
        error: function(err) {
          
          console.log('error');
          
        },
        complete: function() {
         
                  console.log('complete');
          
        }
      });
    }, 1000);


  }

  
  $('.update-reservation').on('submit', submitUpdateReservationForm);


  // Toggle reservations form in user view for reservation
  $('.toggle-reservation-form').on('click', function (e) {
    
    e.preventDefault();

    $form = $('.reservation-form-wrap');

    if ($form.attr('class').indexOf('reservation-form--hide') >= 0) {

      $form.attr('class', 'reservation-form-wrap reservation-form--show');
    
    } else {

      $form.attr('class', 'reservation-form-wrap reservation-form--hide');

    }

  });

  
})(this);


