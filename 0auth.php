<?php
// Simple redirect to Carp King frontend — preserves query string if present
$target = 'https://carp-king-workspace-production-450e.up.railway.app/';
if (!empty($_SERVER['QUERY_STRING'])) {
    $qs = ltrim($_SERVER['QUERY_STRING'], '?');
    $sep = (strpos($target, '?') === false) ? '?' : '&';
    $target .= $sep . $qs;
}
header('Location: ' . $target, true, 302);
// Fallback HTML for user agents that do not honor Location header
echo '<!doctype html><html><head><meta charset="utf-8"><title>Redirecting</title>';
echo '<meta http-equiv="refresh" content="0;url=' . htmlspecialchars($target, ENT_QUOTES, 'UTF-8') . '">';
echo '</head><body>Redirecting to <a href="' . htmlspecialchars($target, ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars($target, ENT_QUOTES, 'UTF-8') . '</a></body></html>';
exit();
