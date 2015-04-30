/* reservr
 */

(function(global) {

  // init foundation
  $(document).foundation();
  
  // init rome datetime picker
  rome(document.querySelector('.event-date'), {
    weekStart: 1
  });
  
})(this);


