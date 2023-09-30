package net.caltona.simplefinance.db;

import net.caltona.simplefinance.db.model.DSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DSettingDAO extends JpaRepository<DSetting, String> {

}
