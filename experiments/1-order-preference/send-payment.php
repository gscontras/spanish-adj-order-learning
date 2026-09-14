<?php

header("Content-Type: application/json; charset=UTF-8");

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(array("success" => false));
    exit;
}

// Read JSON sent from the experiment
$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(array("success" => false));
    exit;
}

$payment_method = isset($input["payment_method"])
    ? trim($input["payment_method"])
    : "";

$payment_identifier = isset($input["payment_identifier"])
    ? trim($input["payment_identifier"])
    : "";

// Only accept the payment methods offered in the experiment
$allowed_methods = array(
    "mercado_pago_alias" => "Alias de Mercado Pago",
    "cvu" => "CVU de Mercado Pago",
    "bank_alias" => "Alias bancario"
);

if (
    !array_key_exists($payment_method, $allowed_methods) ||
    $payment_identifier === "" ||
    strlen($payment_identifier) > 200
) {
    http_response_code(400);
    echo json_encode(array("success" => false));
    exit;
}

// Email destination
$to = "mariadj2@uci.edu";

// Fixed subject so the messages are easy to filter
$subject = "Spanish Adjective Order Study - Payment Information";

// Payment information ONLY.
// Do not include experiment responses or participant demographics.
$message =
    "Payment method: " . $allowed_methods[$payment_method] . "\n" .
    "Payment identifier: " . $payment_identifier . "\n";

$headers = "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email
$sent = mail($to, $subject, $message, $headers);

if ($sent) {
    echo json_encode(array("success" => true));
} else {
    http_response_code(500);
    echo json_encode(array("success" => false));
}

?>