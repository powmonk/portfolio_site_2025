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

// Function to scan portfolio directory and get items
function getPortfolioItems() {
    $portfolioDir = 'portfolio';
    $items = [];
    $id = 1;
    
    // Check if directory exists
    if (!is_dir($portfolioDir)) {
        return ['error' => 'Portfolio directory not found'];
    }
    
    // Get all subdirectories
    $subdirs = array_filter(glob($portfolioDir . '/*'), 'is_dir');
    
    foreach ($subdirs as $subdir) {
        $dirName = basename($subdir);
        
        // Get all files in this subdirectory
        $files = array_filter(glob($subdir . '/*'), 'is_file');
        
        // Skip empty directories
        if (empty($files)) {
            continue;
        }
        
        // Check for metadata.json file first
        $jsonFile = $subdir . '/metadata.json';
        if (!file_exists($jsonFile)) {
            // Skip folders without a metadata.json file
            continue;
        }
        
        $jsonData = json_decode(file_get_contents($jsonFile), true);
        if (!$jsonData || !isset($jsonData['title'])) {
            // Skip if JSON is invalid or doesn't have a title
            continue;
        }
        
        // Get data from JSON
        $title = $jsonData['title'];
        $description = isset($jsonData['description']) ? $jsonData['description'] : 'No description provided.';
        $tags = isset($jsonData['tags']) && is_array($jsonData['tags']) ? $jsonData['tags'] : [];
        $date = isset($jsonData['date']) ? $jsonData['date'] : date('Y-m-d', filemtime($subdir));
        
        // Get external link from JSON if available
        $externalLink = isset($jsonData['link']) ? $jsonData['link'] : null;
        
        // Initialize media variables
        $thumbnail = null;
        $mediaType = null;
        $mediaSrc = null;
        $galleryImages = [];
        
        // First, look for a file named "main.*" to use as the main image
        $mainFile = null;
        foreach ($files as $file) {
            $filename = basename($file);
            $filenameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);
            
            if (strtolower($filenameWithoutExt) === 'main' && isImage($filename)) {
                $mainFile = $file;
                break;
            }
        }
        
        // If no main file found, look for the first image or video
        if (!$mainFile) {
            foreach ($files as $file) {
                $filename = basename($file);
                
                // Skip metadata file and hidden files
                if ($filename === 'metadata.json' || substr($filename, 0, 1) === '.') {
                    continue;
                }
                
                if (isImage($filename) || isVideo($filename)) {
                    $mainFile = $file;
                    break;
                }
            }
        }
        
        // If still no main file found, skip this item
        if (!$mainFile) {
            continue;
        }
        
        $filename = basename($mainFile);
        $thumbnail = $mainFile;
        
        if (isImage($filename)) {
            $mediaType = 'image';
        } else {
            $mediaType = 'video';
        }
        
        $mediaSrc = $mainFile;
        
        // Collect all images for the gallery (excluding the main image)
        foreach ($files as $file) {
            $filename = basename($file);
            
            // Skip metadata file, hidden files, and the main file
            if ($filename === 'metadata.json' || substr($filename, 0, 1) === '.' || $file === $mainFile) {
                continue;
            }
            
            // Add images to the gallery
            if (isImage($filename)) {
                $galleryImages[] = $file;
            }
        }
        
        // If main file is an image, add it to the beginning of gallery
        if ($mediaType === 'image') {
            array_unshift($galleryImages, $mainFile);
        }
        
        // Get all media files for this item
        $mediaFiles = [];
        foreach ($files as $file) {
            $filename = basename($file);
            
            // Skip non-media files and metadata file
            if ((!isImage($filename) && !isVideo($filename)) || $filename === 'metadata.json') {
                continue;
            }
            
            $mediaFiles[] = [
                'src' => $file,
                'type' => isImage($filename) ? 'image' : 'video'
            ];
        }
        
        // Create item entry
        $items[] = [
            'id' => $id++,
            'title' => $title,
            //'description' => $description,
            'type' => $mediaType,
            'src' => $mediaSrc,
            //'gallery' => $galleryImages,
            'tags' => $tags,
            'date' => $date,
            //'mediaFiles' => $mediaFiles,
            'link' => $externalLink
        ];
    }
    
    // Sort items by date, with newest first (oldest last)
    usort($items, function($a, $b) {
        // Convert dates to timestamps for comparison
        $dateA = strtotime($a['date']);
        $dateB = strtotime($b['date']);
        
        // If either date is invalid, fallback to sorting by ID
        if ($dateA === false || $dateB === false) {
            return $a['id'] - $b['id'];
        }
        
        // Sort in descending order (newest first)
        return $dateB - $dateA;
    });
    
    // Reassign IDs after sorting to maintain consecutive numbering
    foreach ($items as $key => $item) {
        $items[$key]['id'] = $key + 1;
    }
    
    return $items;
}

// Get portfolio items
$portfolioItems = getPortfolioItems();

// Return as JSON
header('Content-Type: application/json');
echo json_encode($portfolioItems);
?>
