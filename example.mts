// example.mts
import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

const elevenlabs = new ElevenLabsClient();

const audio = await elevenlabs.textToSoundEffects.convert({
  text: "Cinematic Braam, Horror",
});

await play(audio);
