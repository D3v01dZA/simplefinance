package net.caltona.simplefinance.db;

import net.caltona.simplefinance.db.model.DAccountConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DAccountConfigDAO extends JpaRepository<DAccountConfig, String> {

}
