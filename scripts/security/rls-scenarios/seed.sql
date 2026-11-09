insert into profiles (id,email,role,owned_brands) values
 ('00000000-0000-0000-0000-00000000000a','user@x.com','user','{}'),
 ('00000000-0000-0000-0000-00000000000b','owner1@x.com','brand_admin','{b1}'),
 ('00000000-0000-0000-0000-00000000000c','owner2@x.com','brand_admin','{b2}'),
 ('00000000-0000-0000-0000-00000000000d','super@x.com','super_admin','{}');
insert into brands values ('b1','Brand One',4,'00000000-0000-0000-0000-00000000000b',null),('b2','Brand Two',5,'00000000-0000-0000-0000-00000000000c',null);
insert into products (title,brand_id) values ('P1','b1'),('P2','b2');
insert into catalogues values ('c1','b1','Cat One',null,null),('c2','b2','Cat Two',null,null);
insert into catalogue_images (catalogue_id,image_url) values ('c1','i1'),('c2','i2');
insert into tailors values ('t1','b1','Tailor One',null),('t2','b2','Tailor Two',null);
insert into brand_images (brand_id,role,storage_path) values ('b1','cover','x'),('b2','cover','y');
insert into reviews (brand_id,author,comment,rating,user_id) values ('b1','User','nice',5,'00000000-0000-0000-0000-00000000000a'),('b2','Other','great',5,'00000000-0000-0000-0000-0000000000ff');
