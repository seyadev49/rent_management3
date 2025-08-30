@@ .. @@
   "status" varchar(30) DEFAULT NULL,
   "start_date" date DEFAULT (curdate()),
   "end_date" date DEFAULT ((curdate() + interval 30 day)),
   "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   "billing_cycle" varchar(50) DEFAULT 'monthly',
   "receipt_path" varchar(255) DEFAULT NULL,
   PRIMARY KEY ("id"),
   KEY "organization_id" ("organization_id"),
   CONSTRAINT "subscription_history_ibfk_1" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE
 );