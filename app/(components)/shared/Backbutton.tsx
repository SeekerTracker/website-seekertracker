import Link from 'next/link';
import styles from './shared.module.css';


const Backbutton = () => {
    return (
        <div className={styles.backButton}>
            <Link href={"/"}>
                ← Back to Tracker
            </Link>
        </div>
    )
}

export default Backbutton