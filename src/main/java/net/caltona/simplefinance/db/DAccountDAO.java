package net.caltona.simplefinance.db;

import net.caltona.simplefinance.db.model.DAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DAccountDAO extends JpaRepository<DAccount, String> {

}
