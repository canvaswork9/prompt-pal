import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface XPToastProps {
  amount: number | null;
  reason: string;
  onDone: () => void;
}

const XPToast = ({ amount, reason, onDone }: XPToastProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (amount) {
      setShow(true);
      const t = setTimeout(() => { setShow(false); onDone(); }, 2000);
      return () => clearTimeout(t);
    }
  }, [amount, onDone]);

  return (
    <AnimatePresence>
      {show && amount && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-xl bg-card card-shadow flex items-center gap-3"
        >
          <motion.span
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="text-2xl"
          >
            ⚡
          </motion.span>
          <div>
            <div className="font-mono text-primary font-semibold">+{amount} XP</div>
            <div className="text-xs text-muted-foreground">{reason}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPToast;
