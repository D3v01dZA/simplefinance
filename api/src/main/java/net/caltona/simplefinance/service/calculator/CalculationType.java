package net.caltona.simplefinance.service.calculator;

import net.caltona.simplefinance.api.model.JBalance;

import java.math.BigDecimal;

public enum CalculationType {
    IGNORED {
        @Override
        public void addTotal(TotalType totalType, Totals totals, BigDecimal amount) {

        }

        @Override
        public void addTransfer(TotalType totalType, Totals totals, BigDecimal amount) {

        }

        @Override
        public void addNet(Totals totals, BigDecimal amount) {

        }

        @Override
        protected BigDecimal calculateFlow(BigDecimal balance, BigDecimal transfer) {
            return balance.subtract(transfer);
        }
    },
    ASSET {
        @Override
        public void addNet(Totals totals, BigDecimal amount) {
            totals.setNet(totals.getNet().add(amount));
        }

        @Override
        protected BigDecimal calculateFlow(BigDecimal balance, BigDecimal transfer) {
            return balance.subtract(transfer);
        }
    },
    LIABILITY {
        @Override
        public void addNet(Totals totals, BigDecimal amount) {
            totals.setNet(totals.getNet().subtract(amount));
        }

        @Override
        protected BigDecimal calculateFlow(BigDecimal balance, BigDecimal transfer) {
            return balance.subtract(transfer).negate();
        }
    };

    public void addTotal(TotalType totalType, Totals totals, BigDecimal amount) {
        JBalance.TotalBalance current = totals.getTotalBalances().get(totalType);
        totals.getTotalBalances().put(totalType, new JBalance.TotalBalance(totalType, current.getBalance().add(amount), current.getTransfer(), current.getFlow()));
    }

    public void addTransfer(TotalType totalType, Totals totals, BigDecimal amount) {
        JBalance.TotalBalance current = totals.getTotalBalances().get(totalType);
        totals.getTotalBalances().put(totalType, new JBalance.TotalBalance(totalType, current.getBalance(), current.getTransfer().add(amount), current.getFlow()));
    }

    public void addFlow(TotalType totalType, Totals totals, BigDecimal flow) {
        JBalance.TotalBalance current = totals.getTotalBalances().get(totalType);
        totals.getTotalBalances().put(totalType, new JBalance.TotalBalance(totalType, current.getBalance(), current.getTransfer(), flow));
    }

    public abstract void addNet(Totals totals, BigDecimal amount);

    public BigDecimal calculateFlow(TotalType totalType, Totals totals) {
        JBalance.TotalBalance totalBalance = totals.getTotalBalances().get(totalType);
        return calculateFlow(totalBalance.getBalance(), totalBalance.getTransfer());
    }

    protected abstract BigDecimal calculateFlow(BigDecimal balance, BigDecimal transfer);
}
