import { Button, Text } from "@jordanscamp/ds";
import { useState } from "react";

import styles from "./Counter.module.css";

export default function Counter({ label = "Clicks" }: { label?: string }) {
  const [count, setCount] = useState(0);
  return (
    <div className={styles.counter}>
      <Text variant="label" tone="muted" as="span">
        {label}: {count}
      </Text>
      <Button size="sm" onClick={() => setCount((n) => n + 1)}>
        Click me
      </Button>
    </div>
  );
}
