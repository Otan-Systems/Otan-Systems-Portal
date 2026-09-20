<?php
header('Content-Type: application/json; charset=utf-8');

$to = 'otansystems@gmail.com';

function respond($ok, $message = '') {
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request.');
}

$firstName   = trim($_POST['first_name']   ?? '');
$lastName    = trim($_POST['last_name']    ?? '');
$phone       = trim($_POST['phone']        ?? '');
$description = trim($_POST['description']  ?? '');
$telegram    = trim($_POST['telegram']     ?? '');

// --- validation ---
if ($firstName === '' || mb_strlen($firstName) > 100) {
    respond(false, 'Please enter your first name.');
}
if ($lastName === '' || mb_strlen($lastName) > 100) {
    respond(false, 'Please enter your last name.');
}
if (!preg_match('/^\+\d\s\(\d{3}\)\s\d{2}-\d{2}$/', $phone)) {
    respond(false, 'Phone number must look like +X (XXX) XX-XX.');
}
if ($description === '' || mb_strlen($description) > 150) {
    respond(false, 'Description must be 1-150 characters.');
}
if (!in_array($telegram, ['Installed', 'Not installed'], true)) {
    respond(false, 'Please tell us whether you installed Telegram.');
}

// --- build email ---
$subject = 'Moonflower application: ' . $firstName . ' ' . $lastName;

$body  = "### First name\n{$firstName}\n\n";
$body .= "### Last name\n{$lastName}\n\n";
$body .= "### Phone No.\n{$phone}\n\n";
$body .= "### Description\n{$description}\n\n";
$body .= "### Telegram App\n{$telegram}\n";

$headers   = [];
$headers[] = 'From: Moonflower Form <no-reply@' . ($_SERVER['SERVER_NAME'] ?? 'moonflower.local') . '>';
$headers[] = 'Reply-To: ' . 'no-reply@' . ($_SERVER['SERVER_NAME'] ?? 'moonflower.local');
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    respond(true, 'Sent.');
} else {
    respond(false, 'Could not send the message. Please try again later.');
}
