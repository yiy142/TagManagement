(function ($) {
  $.fn.mdbTreeview = function () {
    const $this = $(this);

    if ($this.hasClass('treeview')) {
      const $toggler = $this.find('.rotate');
      $.each($toggler, (e) => {
        $($toggler[e]).off('click');
        $($toggler[e]).on('click', function () {
          const $this = $(this);
          $this.siblings('.nested').toggleClass('active');
          $this.toggleClass('down');
        });
      });
    }

    if ($this.hasClass('treeview-animated')) {
      const $elements = $this.find('.treeview-animated-element');

      const $closed = $this.find('.closed');

      $this.find('.nested').hide();

      $closed.off('click');
      $closed.on('click', function () {
        const $this = $(this);
        const $target = $this.siblings('.nested');
        const $pointer = $this.children('.fa-angle-right');

        $this.toggleClass('open');
        $pointer.toggleClass('down');
        !$target.hasClass('active') ? $target.addClass('active').slideDown() : $target.removeClass('active').slideUp();
        return false;
      });

      $elements.off('click');
      $elements.on('click', function () {
        const $this = $(this);
        $this.hasClass('opened') ? $this.removeClass('opened') : ($elements.removeClass('opened'), $this.addClass('opened'));
      });
    }

  };
}(jQuery));
