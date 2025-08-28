<?php
// Function to get file extension
function getFileExtension($filename) {
    return strtolower(pathinfo($filename, PATHINFO_EXTENSION));
}

// Function to determine if a file is an image
function isImage($filename) {
    $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return in_array(getFileExtension($filename), $imageExtensions);
}

// Function to determine if a file is a video
function isVideo($filename) {
    $videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
    return in_array(getFileExtension($filename), $videoExtensions);
}

// Function to scan portfolio directory and get the base items
function getPortfolioItems() {
    $portfolioDir = 'portfolio';
    $items = [];
    $id = 1;
    
    if (!is_dir($portfolioDir)) {
        return [];
    }
    
    $subdirs = array_filter(glob($portfolioDir . '/*'), 'is_dir');
    
    foreach ($subdirs as $subdir) {
        $files = array_filter(glob($subdir . '/*'), 'is_file');
        
        if (empty($files) || !file_exists($subdir . '/metadata.json')) {
            continue;
        }
        
        $jsonData = json_decode(file_get_contents($subdir . '/metadata.json'), true);
        if (!$jsonData || !isset($jsonData['title'])) {
            continue;
        }
        
        $mainFile = null;
        foreach ($files as $file) {
            if (strtolower(pathinfo($file, PATHINFO_FILENAME)) === 'main' && isImage(basename($file))) {
                $mainFile = $file;
                break;
            }
        }
        
        if (!$mainFile) {
            foreach ($files as $file) {
                $filename = basename($file);
                if ($filename !== 'metadata.json' && substr($filename, 0, 1) !== '.' && (isImage($filename) || isVideo($filename))) {
                    $mainFile = $file;
                    break;
                }
            }
        }
        
        if (!$mainFile) continue;

        $items[] = [
            'id' => $id++,
            'title' => $jsonData['title'],
            'type' => isImage(basename($mainFile)) ? 'image' : 'video',
            'src' => $mainFile,
            'tags' => isset($jsonData['tags']) && is_array($jsonData['tags']) ? $jsonData['tags'] : [],
            'date' => isset($jsonData['date']) ? $jsonData['date'] : date('Y-m-d', filemtime($subdir)),
            'link' => isset($jsonData['link']) ? $jsonData['link'] : null
        ];
    }
    
    usort($items, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    foreach ($items as $key => &$item) {
        $item['id'] = $key + 1;
    }
    
    return $items;
}

// Function to get the FULL details for a SINGLE item by its ID
function getFullItemDetails($id, $allItems) {
    foreach ($allItems as $item) {
        if ($item['id'] == $id) {
            $subdir = dirname($item['src']);
            $files = array_filter(glob($subdir . '/*'), 'is_file');
            $jsonFile = $subdir . '/metadata.json';
            $jsonData = json_decode(file_get_contents($jsonFile), true);
            
            $galleryImages = [];
            foreach ($files as $file) {
                $filename = basename($file);
                if (isImage($filename) && $filename !== 'metadata.json' && substr($filename, 0, 1) !== '.') {
                    $galleryImages[] = $file;
                }
            }
            // Ensure main image is first if it's an image
            if ($item['type'] === 'image' && !in_array($item['src'], $galleryImages)) {
                 array_unshift($galleryImages, $item['src']);
            }

            return [
                'id' => $item['id'],
                'title' => $jsonData['title'],
                'description' => isset($jsonData['description']) ? $jsonData['description'] : 'No description provided.',
                'type' => $item['type'],
                'src' => $item['src'],
                'gallery' => $galleryImages,
                'tags' => $item['tags'],
                'link' => $item['link']
            ];
        }
    }
    return null;
}

// --- Main script execution ---

// Get the requested ID from the URL, ensuring it's an integer
$requestedId = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Get the lightweight data for all items to find the correct folder
$allItems = getPortfolioItems();

// Find the specific item and get its full details
$foundItem = getFullItemDetails($requestedId, $allItems);

// Set the content type to JSON
header('Content-Type: application/json');

// If the item was found, return its data. Otherwise, return an error.
if ($foundItem) {
    echo json_encode($foundItem);
} else {
    // Send a 404 Not Found HTTP status code
    http_response_code(404);
    echo json_encode(['error' => 'Portfolio item not found']);
}

exit;
?>