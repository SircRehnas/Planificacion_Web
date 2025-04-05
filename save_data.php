<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'anteproyecto_data.json';

// Función para sanitizar datos
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Manejar solicitud GET (cargar datos)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        echo $content;
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'No existe archivo de datos',
            'anteproyectoHTML' => ''
        ]);
    }
    exit;
}

// Manejar solicitud POST (guardar datos)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Verificar si es un reset
    if (isset($data['reset']) && $data['reset']) {
        if (file_exists($dataFile)) {
            unlink($dataFile);
        }
        echo json_encode(['success' => true]);
        exit;
    }
    
    // Validar datos
    if (!isset($data['anteproyectoHTML'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Datos incompletos'
        ]);
        exit;
    }
    
    // Sanitizar y preparar datos para guardar
    $saveData = [
        'anteproyectoHTML' => sanitizeInput($data['anteproyectoHTML']),
        'lastUpdated' => date('Y-m-d H:i:s')
    ];
    
    // Guardar en archivo
    try {
        file_put_contents($dataFile, json_encode($saveData));
        echo json_encode([
            'success' => true,
            'timestamp' => $saveData['lastUpdated']
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Error al guardar: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Si no es GET ni POST
echo json_encode([
    'success' => false,
    'error' => 'Método no permitido'
]);
?>