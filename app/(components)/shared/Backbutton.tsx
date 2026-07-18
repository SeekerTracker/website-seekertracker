import Link from "next/link";
import styles from "./shared.module.css";

const Backbutton = () => {
  return (
    <div className={styles.backButton}>
      <Link href="/">← Home</Link>
    </div>
  );
};

export default Backbutton;