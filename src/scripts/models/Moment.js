export class Moment {
  constructor() {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.location = null;   // { lat, lng, accuracy }
    this.audioBlob = null;  // Blob (webm)
    this.audioUrl = null;   // Object URL — call cleanup() to revoke
    this.photoBlob = null;  // Blob (jpeg)
    this.photoUrl = null;   // dataURL
    this.text = '';
    this.feel = '';
    this.locationName = '';
    this.tags = [];
  }

  get isComplete() {
    return !!this.audioBlob;
  }

  async captureLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      if (!window.isSecureContext) {
        console.warn('captureLocation: geolocation requires a secure context (HTTPS). Skipping.');
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          this.location = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
          };
          resolve(this.location);
        },
        (err) => {
          console.warn('captureLocation failed:', err.code, err.message);
          resolve(null);
        },
        { timeout: 5000 }
      );
    });
  }

  cleanup() {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      location: this.location,
      hasAudio: !!this.audioBlob,
      hasPhoto: !!this.photoUrl,
      text: this.text,
      feel: this.feel,
      tags: this.tags,
    };
  }
}
