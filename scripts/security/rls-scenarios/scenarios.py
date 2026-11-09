import subprocess, sys
S, DB = sys.argv[1], sys.argv[2]
import os; PORT = os.environ.get("PGPORT_RLS", "54331")
U, O1, O2, SA = ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000b',
                 '00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000d')
NEW = '00000000-0000-0000-0000-0000000000ee'
def w(stmt): return f"with t as ({stmt} returning 1) select count(*) from t"
T = [
 # who, uid, description, sql, should_be_allowed
 ("anon", None, "signed out: create a catalogue", w("insert into catalogues values ('cx','b1','spam',null,null)"), False),
 ("anon", None, "signed out: edit a catalogue", w("update catalogues set title='hacked' where id='c1'"), False),
 ("anon", None, "signed out: delete a tailor", w("delete from tailors where id='t1'"), False),
 ("anon", None, "signed out: delete catalogue images", w("delete from catalogue_images"), False),
 ("anon", None, "signed out: create a notification", w(f"insert into notifications (user_id,title) values ('{O1}','phish')"), False),
 ("anon", None, "signed out: make a super admin profile", w(f"insert into profiles (id,email,role) values ('{NEW}','x@x.com','super_admin')"), False),
 ("authenticated", U, "user: make self super admin", w(f"update profiles set role='super_admin' where id='{U}'"), False),
 ("authenticated", U, "user: give self brand b2", w(f"update profiles set owned_brands='{{b2}}' where id='{U}'"), False),
 ("authenticated", U, "user: edit own name", w(f"update profiles set first_name='Shannon' where id='{U}'"), True),
 ("authenticated", U, "user: edit someone else's profile", w(f"update profiles set first_name='x' where id='{O1}'"), False),
 ("authenticated", U, "user: edit any brand", w("update brands set name='hacked' where id='b2'"), False),
 ("authenticated", U, "user: delete any brand", w("delete from brands where id='b2'"), False),
 ("authenticated", U, "user: create a brand", w("insert into brands (id,name) values ('bx','spam')"), False),
 ("authenticated", U, "user: change a brand's images", w("update brand_images set storage_path='bad' where brand_id='b2'"), False),
 ("authenticated", U, "user: edit someone else's review", w("update reviews set comment='bad' where brand_id='b2'"), False),
 ("authenticated", U, "user: edit own review", w(f"update reviews set comment='edited' where user_id='{U}'"), True),
 ("authenticated", U, "user: post review as self", w(f"insert into reviews (brand_id,author,comment,rating,user_id) values ('b2','User','ok',4,'{U}')"), True),
 ("authenticated", U, "user: post review as someone else", w(f"insert into reviews (brand_id,author,comment,rating,user_id) values ('b2','Fake','bad',1,'{O2}')"), False),
 ("authenticated", U, "user: create a notification", w(f"insert into notifications (user_id,title) values ('{O1}','x')"), False),
 ("authenticated", NEW, "new account: signup creates a plain profile", f"select signup_profile('{NEW}','new@x.com'); select (role='user')::int from profiles where id='{NEW}'", True),
 ("authenticated", NEW, "new account: browser-created profile forced to plain user", f"insert into profiles (id,email,role,owned_brands) values ('{NEW}','n@x.com','super_admin','{{b1}}'); select (role='user' and owned_brands='{{}}')::int from profiles where id='{NEW}'", True),
 ("authenticated", O1, "owner1: edit own brand b1", w("update brands set name='Brand One!' where id='b1'"), True),
 ("authenticated", O1, "owner1: edit other brand b2", w("update brands set name='x' where id='b2'"), False),
 ("authenticated", O1, "owner1: delete own brand b1", w("delete from brands where id='b1'"), True),
 ("authenticated", O1, "owner1: delete other brand b2", w("delete from brands where id='b2'"), False),
 ("authenticated", O1, "owner1: add tailor to b1", w("insert into tailors values ('tn','b1','New',null)"), True),
 ("authenticated", O1, "owner1: add tailor to b2", w("insert into tailors values ('tn','b2','New',null)"), False),
 ("authenticated", O1, "owner1: edit own tailor", w("update tailors set title='x' where id='t1'"), True),
 ("authenticated", O1, "owner1: move own tailor to b2", w("update tailors set brand_id='b2' where id='t1'"), False),
 ("authenticated", O1, "owner1: delete b2's tailor", w("delete from tailors where id='t2'"), False),
 ("authenticated", O1, "owner1: add catalogue to b1", w("insert into catalogues values ('cn','b1','New',null,null)"), True),
 ("authenticated", O1, "owner1: edit b2's catalogue", w("update catalogues set title='x' where id='c2'"), False),
 ("authenticated", O1, "owner1: delete own catalogue", w("delete from catalogues where id='c1'"), True),
 ("authenticated", O1, "owner1: add image to own catalogue", w("insert into catalogue_images (catalogue_id,image_url) values ('c1','n')"), True),
 ("authenticated", O1, "owner1: delete b2's catalogue images", w("delete from catalogue_images where catalogue_id='c2'"), False),
 ("authenticated", O1, "owner1: set own brand image", w("update brand_images set storage_path='new' where brand_id='b1'"), True),
 ("authenticated", O1, "owner1: change b2's brand image", w("update brand_images set storage_path='bad' where brand_id='b2'"), False),
 ("authenticated", O1, "owner1: delete review on own brand", w("delete from reviews where brand_id='b1'"), True),
 ("authenticated", O1, "owner1: delete review on b2", w("delete from reviews where brand_id='b2'"), False),
 ("authenticated", O1, "owner1: edit own product", w("update products set title='x' where brand_id='b1'"), True),
 ("authenticated", O1, "owner1: edit b2's product", w("update products set title='x' where brand_id='b2'"), False),
 ("authenticated", O1, "owner1: add brand b2 to self", w(f"update profiles set owned_brands='{{b1,b2}}' where id='{O1}'"), False),
 ("authenticated", O1, "owner1: make self super admin", w(f"update profiles set role='super_admin' where id='{O1}'"), False),
 ("authenticated", O1, "owner1: mark own notification read", "insert into notifications (id,user_id,brand_id,title) values ('00000000-0000-0000-0000-000000000099','"+O1+"','b1','n'); "+w("update notifications set is_read=true where id='00000000-0000-0000-0000-000000000099'"), True),
 ("authenticated", SA, "super admin: edit any brand", w("update brands set name='ok' where id='b2'"), True),
 ("authenticated", SA, "super admin: edit any catalogue", w("update catalogues set title='ok' where id='c2'"), True),
 ("authenticated", SA, "super admin: delete any tailor", w("delete from tailors where id='t2'"), True),
 ("authenticated", SA, "super admin: delete any review", w("delete from reviews where brand_id='b2'"), True),
 ("authenticated", SA, "super admin: create notification", w(f"insert into notifications (user_id,title) values ('{O1}','hi')"), True),
 ("service_role", None, "server: change a user's role", w(f"update profiles set role='brand_admin', owned_brands='{{b2}}' where id='{U}'"), True),
 ("service_role", None, "server: create notification", w(f"insert into notifications (user_id,title) values ('{O1}','hi')"), True),
 ("service_role", None, "server: delete any brand", w("delete from brands where id='b2'"), True),
]
def run(role, uid, sql):
    pre = "begin; "
    if role == "authenticated" and uid:
        pre += f"set local request.jwt.claim.sub='{uid}'; set local request.jwt.claim.role='authenticated'; "
    # the 'owner1 notification' case seeds a row as postgres first
    if "insert into notifications (id," in sql:
        seed, rest = sql.split("; ", 1)
        pre += seed + "; "
        sql = rest
    pre += f"set local role {role}; "
    p = subprocess.run(["psql","-h",S,"-p",PORT,"-U","postgres","-d",DB,"-tAq","-v","ON_ERROR_STOP=1"], input=pre.replace("; ", ";\n") + sql.replace("; ", ";\n") + ";\nrollback;\n", capture_output=True, text=True)
    if p.returncode != 0:
        return False, p.stderr.strip().split("\n")[0].replace("ERROR:  ","")[:70]
    out = [l for l in p.stdout.split("\n") if l.strip() and l.strip() not in ("BEGIN","ROLLBACK","SET")]
    n = int(out[-1]) if out and out[-1].strip().lstrip('-').isdigit() else 0
    return n > 0, f"{n} row(s)"
fails = 0
for role, uid, desc, sql, want in T:
    ok, info = run(role, uid, sql)
    good = ok == want
    fails += (not good)
    print(f"{'PASS' if good else 'FAIL'}  {'allowed' if ok else 'blocked':<8} (want {'allowed' if want else 'blocked'})  {desc}  [{info}]")
print(f"\n{len(T)-fails}/{len(T)} as intended")
