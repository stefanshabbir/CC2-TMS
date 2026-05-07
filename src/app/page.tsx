import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.background} />
      
      <div className={styles.content}>
        <h1 className={styles.title}>
          Next-Gen Training Management
        </h1>
        <p className={styles.description}>
          Empower your team with a modern, fast, and secure platform to manage courses, track progress, and elevate learning. Powered by Next.js and Supabase.
        </p>
        
        <div className={styles.cards}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Course Management</h2>
            <p className={styles.cardText}>
              Create and organize training modules with ease. Track completion rates and user engagement in real-time.
            </p>
          </div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Real-time Analytics</h2>
            <p className={styles.cardText}>
              Leverage the power of Supabase for instantaneous data synchronization and detailed reporting.
            </p>
          </div>
        </div>

        <a href="#" className={styles.button}>
          Get Started
        </a>
      </div>
    </main>
  );
}
