INSERT INTO public.user_roles (user_id, role)
SELECT '4e61af1b-9841-4db4-b169-0ae17addbd71', 'admin'
WHERE EXISTS (
	SELECT 1
	FROM auth.users
	WHERE id = '4e61af1b-9841-4db4-b169-0ae17addbd71'
)
ON CONFLICT (user_id, role) DO NOTHING;