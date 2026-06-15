-- 0016: tighten goal_items own-write policy (P1-10 follow-up).
-- The 0011 policy allowed WITH CHECK (user_id = auth.uid() OR added_by = auth.uid()),
-- which let any user insert a goal item onto ANOTHER user's day by setting
-- added_by to themselves. Manager push-planning has its own policy
-- (goal_items_manager_insert), so own-writes must be strictly user_id = self.

drop policy goal_items_own on goal_items;

create policy goal_items_own on goal_items for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
