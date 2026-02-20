import { useState } from 'react';
import TypingMessage from './TypingMessage';
import OptionButtons from './OptionButtons';
import styles from './WelcomeScreen.module.css';

const WELCOME_TEXT =
  "you find yourself in a tent. it's raining outside. " +
  "the lantern glows warm. your cat is probably here somewhere.";

export default function WelcomeScreen() {
  const [typingDone, setTypingDone] = useState(false);

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <TypingMessage
          text={WELCOME_TEXT}
          onComplete={() => setTypingDone(true)}
        />
        <OptionButtons visible={typingDone} />
      </div>
    </div>
  );
}
