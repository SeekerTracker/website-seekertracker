
"use client";
import Navbar from "./(components)/navbar";
import MainPage from "./(pages)/mainPage";
import { useDataContext } from "./(utils)/context/dataProvider";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.mainContainer}>
      <MainPage />
    </div>
  );
}
