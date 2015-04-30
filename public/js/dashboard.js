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
  
})(this);


