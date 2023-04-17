package net.caltona.simplefinance.db;

import net.caltona.simplefinance.db.model.DTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DTransactionDAO extends JpaRepository<DTransaction, String> {

}
