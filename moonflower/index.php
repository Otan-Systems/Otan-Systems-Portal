<?php
// Config: where to send submissions and where the Telegram group lives.
$telegramUrl = 'https://t.me/+DSjKMfmx6yM4NDZi';
$lobbyUrl    = 'https://otansystems.com';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Moonflower</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<header class="topbar">
  <div class="topbar-inner">
    <a class="pill pill-light" href="<?php echo htmlspecialchars($lobbyUrl); ?>">To Lobby</a>
    <span class="brand">Moonflower</span>
    <a class="pill pill-light" href="<?php echo htmlspecialchars($telegramUrl); ?>" target="_blank" rel="noopener">Join us</a>
  </div>
</header>

<section class="hero">
  <div class="container hero-inner">
    <div class="hero-art" aria-hidden="true">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="petal" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#c8bdfb"/>
            <stop offset="100%" stop-color="#6a5bd6"/>
          </radialGradient>
          <radialGradient id="moon" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stop-color="#f4f4f6"/>
            <stop offset="100%" stop-color="#b9bcc6"/>
          </radialGradient>
        </defs>
        <g>
          <ellipse cx="100" cy="60"  rx="34" ry="46" fill="url(#petal)"/>
          <ellipse cx="100" cy="140" rx="34" ry="46" fill="url(#petal)"/>
          <ellipse cx="60"  cy="100" rx="46" ry="34" fill="url(#petal)"/>
          <ellipse cx="140" cy="100" rx="46" ry="34" fill="url(#petal)"/>
        </g>
        <circle cx="100" cy="100" r="30" fill="url(#moon)"/>
      </svg>
    </div>

    <div class="hero-copy">
      <h1>Moonflower</h1>
      <div class="hero-actions">
        <a href="#apply" class="btn btn-primary">Fill out the form</a>
        <a href="mailto:otansystems@gmail.com" class="btn btn-secondary">Contact us</a>
      </div>
    </div>
  </div>
</section>

<div class="divider"></div>

<section class="invite">
  <div class="container">
    <div class="invite-row">
      <button type="button" class="pill btn-copy" id="copyBtn">Copy</button>
      <a class="invite-link" id="inviteLink" href="<?php echo htmlspecialchars($telegramUrl); ?>" target="_blank" rel="noopener"><?php echo htmlspecialchars($telegramUrl); ?></a>
    </div>
    <p class="copy-note" id="copyNote"></p>
  </div>
</section>

<section class="form-section" id="apply">
  <div class="container">
    <h2>Fill out the form</h2>

    <form id="joinForm" novalidate>
      <div>
        <label for="first_name">Your name:</label>
        <input type="text" id="first_name" name="first_name" required autocomplete="given-name">
      </div>

      <div>
        <label for="last_name">Your last name:</label>
        <input type="text" id="last_name" name="last_name" required autocomplete="family-name">
      </div>

      <div>
        <label for="phone">Your phone no.:</label>
        <input type="tel" id="phone" name="phone" required
               placeholder="+X (XXX) XX-XX"
               pattern="^\+\d\s\(\d{3}\)\s\d{2}-\d{2}$"
               title="Format: +X (XXX) XX-XX"
               autocomplete="tel">
      </div>

      <div class="field-row">
        <div class="field-main">
          <label for="description">Tell us more about yourself:</label>
          <textarea id="description" name="description" maxlength="150" required></textarea>
          <div class="char-count"><span id="charCount">0</span>/150</div>
        </div>

        <div class="telegram-check">
          <span>Did you install Telegram App?</span>
          <div class="radio-group">
            <div class="radio-pill">
              <input type="radio" id="tg_yes" name="telegram" value="Installed" required>
              <label for="tg_yes">Yes, I did</label>
            </div>
            <div class="radio-pill">
              <input type="radio" id="tg_no" name="telegram" value="Not installed">
              <label for="tg_no">No, but I will</label>
            </div>
          </div>
        </div>
      </div>

      <div class="submit-row">
        <button type="submit" class="pill btn-submit">Submit</button>
        <span class="form-status" id="formStatus"></span>
      </div>
    </form>
  </div>
</section>

<footer>&copy; <?php echo date('Y'); ?> Moonflower &middot; Otan Systems</footer>

<script src="script.js"></script>
</body>
</html>
