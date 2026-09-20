document.addEventListener('DOMContentLoaded', function () {

  /* ---- copy telegram link ---- */
  var copyBtn  = document.getElementById('copyBtn');
  var linkEl   = document.getElementById('inviteLink');
  var copyNote = document.getElementById('copyNote');

  if (copyBtn) {
    copyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var text = linkEl.textContent.trim();
      var done = function () {
        copyNote.textContent = 'Link copied!';
        setTimeout(function () { copyNote.textContent = ''; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        var tmp = document.createElement('textarea');
        tmp.value = text;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(tmp);
        done();
      }
    });
  }

  /* ---- phone mask: +X (XXX) XX-XX ---- */
  var phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', function () {
      var digits = phone.value.replace(/\D/g, '').slice(0, 8);
      var out = '';
      if (digits.length > 0) out += '+' + digits.slice(0, 1);
      if (digits.length > 1) out += ' (' + digits.slice(1, 4);
      if (digits.length >= 4) out += ')';
      if (digits.length > 4) out += ' ' + digits.slice(4, 6);
      if (digits.length > 6) out += '-' + digits.slice(6, 8);
      phone.value = out;
    });
  }

  /* ---- character counter ---- */
  var desc = document.getElementById('description');
  var count = document.getElementById('charCount');
  if (desc && count) {
    desc.addEventListener('input', function () {
      count.textContent = desc.value.length;
    });
  }

  /* ---- submit via fetch to submit.php ---- */
  var form = document.getElementById('joinForm');
  var status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = 'Sending...';
      status.className = 'form-status';

      var data = new FormData(form);

      fetch('submit.php', { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            status.textContent = 'Thanks! Your form was sent.';
            status.className = 'form-status ok';
            form.reset();
            count.textContent = '0';
          } else {
            status.textContent = res.message || 'Please check the form and try again.';
            status.className = 'form-status err';
          }
        })
        .catch(function () {
          status.textContent = 'Something went wrong. Please try again.';
          status.className = 'form-status err';
        });
    });
  }
});
