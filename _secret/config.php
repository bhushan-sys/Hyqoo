
<?php

return [
    'base_url' => 'https://cmsapi.hyqoo.com/api/v1/hq',

    // Store your real API token here.
    'token' => 'hq_qzPf5v57fbQRxT4LVQ6a355z9rmMnCdL',

    // Define permitted endpoints using unique keys.
    'endpoints' => [
        'talent_profiles' => [
            'path' => '/public/talent/profiles',
            'method' => 'GET',
        ],

        // Add more endpoints here.
        'another_endpoint' => [
            'path' => '/public/another-endpoint',
            'method' => 'GET',
        ],
    ],
];
