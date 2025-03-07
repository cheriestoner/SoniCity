// Storage utility for managing recordings
class RecordingStorage {
    constructor() {
        this.recordings = [];
        this.loadRecordings();
    }

    loadRecordings() {
        const saved = localStorage.getItem('recordings');
        if (saved) {
            this.recordings = JSON.parse(saved);
        }
    }

    saveRecordings() {
        localStorage.setItem('recordings', JSON.stringify(this.recordings));
    }

    addRecording(blob, metadata = {}) {
        const recording = {
            id: Date.now(),
            url: URL.createObjectURL(blob),
            blob: blob,
            date: new Date().toISOString(),
            ...metadata
        };
        
        this.recordings.push(recording);
        this.saveRecordings();
        return recording;
    }

    getRecordings() {
        return this.recordings;
    }

    deleteRecording(id) {
        const index = this.recordings.findIndex(r => r.id === id);
        if (index !== -1) {
            URL.revokeObjectURL(this.recordings[index].url);
            this.recordings.splice(index, 1);
            this.saveRecordings();
        }
    }
}

// Create a singleton instance
const storage = new RecordingStorage();
export default storage; 