<?php

namespace OpenSourceMapApi;

class Client {
    private string $baseUrl;
    private ?string $apiKey;

    public function __construct(string $baseUrl, ?string $apiKey = null) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey = $apiKey;
    }

    private function request(string $path, array $payload = null): array {
        $ch = curl_init($this->baseUrl . $path);
        $headers = ['Content-Type: application/json'];
        if ($this->apiKey) {
            $headers[] = 'x-api-key: ' . $this->apiKey;
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        if ($payload !== null) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }
        $response = curl_exec($ch);
        if ($response === false) {
            throw new \RuntimeException(curl_error($ch));
        }
        curl_close($ch);
        return json_decode($response, true);
    }

    public function getConfig(): array { return $this->request('/api/maps/config'); }
    public function autocomplete(array $payload): array { return $this->request('/api/maps/autocomplete', $payload); }
    public function reverseGeocode(array $payload): array { return $this->request('/api/maps/reverse-geocode', $payload); }
    public function route(array $payload): array { return $this->request('/api/maps/route', $payload); }
}
