import styles from "./App.module.css";
import { Bracket } from "./components/Bracket/Bracket";
import { BRACKET } from "./data/bracket";

export function App() {
  return (
    <div className={styles.app}>
      <Bracket bracket={BRACKET} />
    </div>
  );
}
