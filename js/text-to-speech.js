// TODO: quick experiment
const synth = window.speechSynthesis;

// TODO: Generalize, for now only adapted to Chrome settings and voice
const pitchValue = 0.7;
const rateValue = 1;
let desiredVoice = null;

function canSpeak() {
  if (!synth || !desiredVoice) {
    return false;
  }
  return true;
}

function getVoices() {
  desiredVoice = synth
    .getVoices()
    .filter((voice) => voice.lang === "en-GB" && voice.name.includes("Male"))
    .pop();

  if (!desiredVoice) {
    // not yet ready, or not present
    return;
  }
}

function speak(fullText) {
  if (!desiredVoice) {
    return;
  }

  fullText = fullText.replace(
    /(\[\[.*?\]\]|<table>.*?<\/table>|<strong>|<\/strong>|<i>|<\/i>)/gi,
    ""
  );
  fullText = fullText.replace(/<h3>/gi, " ");
  fullText = fullText.replace(/(<\/h3>|<br>|<br\/>)/gi, ".");

  if (synth.speaking) {
    // Unstable!
    // if (synth.paused) {
    //   synth.resume();
    // } else {
    //   synth.pause();
    // }
    return;
  }

  fullText.split(/[.,\:;!\?]| - /).forEach((textFragment) => {
    const text = textFragment.trim();
    if (text.length > 0 && text !== "'") {
      console.log(text);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = desiredVoice;
      utterance.pitch = pitchValue;
      utterance.rate = rateValue;
      synth.speak(utterance);
    }
  });
}

getVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = getVoices;
}

document.addEventListener("DOMContentLoaded", function () {
  if (!canSpeak()) {
    const speechDiv = document.getElementById("speech");
    if (speechDiv) {
      speechDiv.style.display = "none";
    }
  }
});
