-- Menu (5 de 5): el menu de hoy de la pagina vieja, para que el duenio arranque con lo que
-- tiene. No hace nada si el local principal ya tiene categorias. Los montos van en centavos.

create function pg_temp.categoria(el_local uuid, nombre text, subtitulo text, foto text, icono text, orden integer)
returns uuid language sql as $$
  insert into public.categorias (local_id, nombre, subtitulo, foto, icono, orden, visible)
  values (el_local, nombre, subtitulo, foto, icono, orden, true) returning id
$$;

create function pg_temp.presentacion(la_categoria uuid, nombre text, orden integer, compartido bigint)
returns uuid language plpgsql as $$
declare
  el_local uuid := (select local_id from public.categorias where id = la_categoria);
  la_presentacion uuid;
begin
  insert into public.presentaciones (local_id, categoria_id, nombre, orden)
  values (el_local, la_categoria, nombre, orden) returning id into la_presentacion;
  if compartido is not null then
    insert into public.precios (local_id, presentacion_id, monto_centavos)
    values (el_local, la_presentacion, compartido);
  end if;
  return la_presentacion;
end
$$;

-- montos: uno por presentacion, en el orden de las presentaciones; null es "no tiene".
create function pg_temp.producto(
  la_categoria uuid, nombre text, descripcion text, etiqueta text, orden integer, montos bigint[]
)
returns void language plpgsql as $$
declare
  el_local uuid := (select local_id from public.categorias where id = la_categoria);
  el_producto uuid;
  pre record;
begin
  insert into public.productos (local_id, categoria_id, nombre, descripcion, etiqueta, orden, visible)
  values (el_local, la_categoria, nombre, descripcion, etiqueta::public.etiqueta_de_producto, orden, true)
  returning id into el_producto;
  for pre in select x.id, x.orden from public.presentaciones x where x.categoria_id = la_categoria order by x.orden loop
    if montos[pre.orden + 1] is not null then
      insert into public.precios (local_id, presentacion_id, producto_id, monto_centavos)
      values (el_local, pre.id, el_producto, montos[pre.orden + 1]);
    end if;
  end loop;
end
$$;

do $$
declare
  el_local uuid := (select id from public.locales order by fecha_creacion, id limit 1);
  c uuid;
begin
  if exists (select 1 from public.categorias where local_id = el_local) then
    return;
  end if;

  c := pg_temp.categoria(el_local, 'Facturas', null, '/menu/facturas.jpg', '🥐', 0);
  perform pg_temp.presentacion(c, 'Docena', 0, 2000000);
  perform pg_temp.presentacion(c, 'Media docena', 1, 1200000);
  perform pg_temp.presentacion(c, 'Unidad', 2, 300000);
  perform pg_temp.producto(c, 'Medialuna', 'Nuestra icónica medialuna de manteca elaborada con un hojaldre de fermentación lenta, bañada en un almíbar suave que realza su brillo y dulzor equilibrado.', 'mas_vendido', 0, '{}');
  perform pg_temp.producto(c, 'Carasucia', 'Una delicia tradicional de masa dulce y esponjosa, cubierta con una generosa y crujiente capa de azúcar negra que se funde en cada bocado.', null, 1, '{}');
  perform pg_temp.producto(c, 'Flor', 'Elegante pétalo de hojaldre crocante relleno con una abundante porción de nuestra exclusiva crema pastelera casera.', null, 2, '{}');
  perform pg_temp.producto(c, 'Trenzita', 'Clásica factura trenzada a mano con dulce de leche y crema pastelera, de textura aireada y suave, ideal para acompañar tus mañanas o tardes de café.', null, 3, '{}');
  perform pg_temp.producto(c, 'Moñito', 'Factura alargada y ligera, espolvoreada con azúcar cristal que aporta una textura crocante sobre su masa tierna.', null, 4, '{}');
  perform pg_temp.producto(c, 'Martita (Santiagueña)', 'Versión rústica y profunda de la pastelería tradicional, elaborada con una sutil mezcla de grasa vacuna y un toque de azúcar tostada.', null, 5, '{}');

  c := pg_temp.categoria(el_local, 'Laminados', 'Por unidad', '/menu/laminados.jpeg', '🧈', 1);
  perform pg_temp.presentacion(c, 'Unidad', 0, null);
  perform pg_temp.producto(c, 'Medialuna XL', 'El doble de placer con un hojaldre perfeccionado durante horas. Elaborada exclusivamente con 100% manteca premium para un sabor lácteo inigualable.', 'mas_vendido', 0, '{400000}');
  perform pg_temp.producto(c, 'Medialuna XL rellena', 'Nuestra imponente medialuna XL rellena generosamente hasta el borde con el más cremoso dulce de leche repostero.', null, 1, '{500000}');
  perform pg_temp.producto(c, 'Croissant', 'Inspirado en la técnica francesa: capas finas como el papel de hojaldre crujiente por fuera y una miga delicadamente alveolada por dentro.', null, 2, '{500000}');
  perform pg_temp.producto(c, 'Croissant relleno', 'Toda la elegancia del croissant rellena de una suave crema de almendras tostadas o chocolate intenso.', null, 3, '{700000}');
  perform pg_temp.producto(c, 'Pan de chocolate', 'Pain au chocolat auténtico, con dos barras internas de chocolate belga semi-amargo que se funden perfectamente en el hojaldre.', null, 4, '{600000}');
  perform pg_temp.producto(c, 'Danesa', 'Masa hojaldrada delicadamente trenzada, combinada con frutas frescas de estación o una corona de crema de vainilla.', null, 5, '{550000}');
  perform pg_temp.producto(c, 'Garrita', 'Pieza artesanal de hojaldre crujiente, pincelada con almíbar y terminada con trozos de almendras o azúcar cristalizada.', null, 6, '{450000}');
  perform pg_temp.producto(c, 'Cañoncito', 'Cilindro de masa de hojaldre extremadamente quebradizo, relleno de punta a punta con el mejor dulce de leche artesanal.', null, 7, '{600000}');
  perform pg_temp.producto(c, 'Napoleón', 'Estructura de hojaldre crujiente de múltiples capas, intercaladas con crema diplomata y un suave toque de dulce de leche.', null, 8, '{600000}');

  c := pg_temp.categoria(el_local, 'Panes', 'Por unidad · Hecho con masa madre', '/menu/panes.jpg', '🍞', 2);
  perform pg_temp.presentacion(c, 'Unidad', 0, null);
  perform pg_temp.producto(c, 'Pan de campo', 'Pan rústico de corteza gruesa y sabor complejo. Elaborado artesanalmente con harinas orgánicas y nuestra masa madre.', 'artesanal', 0, '{950000}');
  perform pg_temp.producto(c, 'Pan integral', 'Molde artesanal denso y nutritivo, elaborado con harina integral de molienda propia y un generoso mix de semillas tostadas.', null, 1, '{950000}');
  perform pg_temp.producto(c, 'Pan lactal', 'Miga extra suave y esponjosa lograda con leche entera y manteca. Ideal para sandwiches gourmet o las mejores tostadas.', null, 2, '{950000}');
  perform pg_temp.producto(c, 'Baguette', 'Clásica francesa de corteza crujiente y dorada con una miga aireada e irregular. Fermentada lentamente con masa madre para un sabor profundo e inconfundible.', null, 3, '{350000}');
  perform pg_temp.producto(c, 'Focaccia', 'Esponjosa y aireada, terminada con un generoso hilo de aceite de oliva y escamas de sal marina. Sus hoyuelos dorados guardan todo el aroma del horno.', null, 4, '{500000}');

  c := pg_temp.categoria(el_local, 'Clásicos', 'Por cuarto', '/menu/clasicos.jpg', '🥨', 3);
  perform pg_temp.presentacion(c, 'Por cuarto', 0, null);
  perform pg_temp.producto(c, 'Bizcochitos (manteca/grasa)', 'El bocado salado por excelencia. Elaborados con una receta basada en manteca pura que los hace deshacerse en la boca.', null, 0, '{650000}');
  perform pg_temp.producto(c, 'Palitos chinos', 'Delgados y crujientes bastoncitos de hojaldre salado, horneados hasta alcanzar un dorado perfecto. El compañero ideal del mate.', null, 1, '{800000}');
  perform pg_temp.producto(c, 'Palmeritas', 'Pequeños corazones de hojaldre caramelizado al horno, logrando ese punto justo entre lo crocante y lo dulce.', null, 2, '{800000}');
  perform pg_temp.producto(c, 'Chipa', 'Pan de queso auténtico elaborado con fécula de mandioca de primera, quesos estacionados y el secreto de nuestra casa.', 'mas_vendido', 3, '{900000}');

  c := pg_temp.categoria(el_local, 'Cafetería', 'Mediano / Grande', '/menu/cafe.jpg', '☕', 4);
  perform pg_temp.presentacion(c, 'Mediano', 0, null);
  perform pg_temp.presentacion(c, 'Grande', 1, null);
  perform pg_temp.producto(c, 'Espresso doble', 'Dos extracciones cortas de nuestros granos seleccionados de altura, para un café con cuerpo y crema densa.', null, 0, '{380000,NULL}');
  perform pg_temp.producto(c, 'Americano', 'Doble shot de espresso vertido sobre agua filtrada a temperatura ideal, resaltando los aromas más delicados del café.', null, 1, '{400000,420000}');
  perform pg_temp.producto(c, 'Cortado', 'Nuestra medida de espresso clásico con una pequeña proporción de leche emulsionada artesanalmente para suavizar su potencia.', null, 2, '{470000,500000}');
  perform pg_temp.producto(c, 'Café con leche', 'El equilibrio perfecto: una base de café intenso combinada con leche fresca vaporizada, logrando una textura sedosa.', null, 3, '{450000,480000}');
  perform pg_temp.producto(c, 'Lágrima', 'Leche vaporizada sedosa servida con un toque sutil —apenas una lágrima— de nuestro café espresso de especialidad.', null, 4, '{460000,540000}');
  perform pg_temp.producto(c, 'Café con leche frío', 'Doble espresso servido sobre leche fresca y cubos de hielo, una opción refrescante que mantiene toda la intensidad.', null, 5, '{NULL,520000}');
  perform pg_temp.producto(c, 'Capuccino', 'Espresso intenso coronado con leche vaporizada y una capa de espuma cremosa, terminado con un toque de cacao amargo espolvoreado.', null, 6, '{NULL,610000}');
  perform pg_temp.producto(c, 'Submarino', 'Leche caliente vaporizada servida junto a una barra de chocolate semi-amargo para sumergir y disfrutar bien derretido.', null, 7, '{NULL,430000}');
  perform pg_temp.producto(c, 'Mocaccino', 'La combinación justa de espresso, chocolate y leche vaporizada, con una textura aterciopelada y un final dulce y envolvente.', null, 8, '{NULL,650000}');

  c := pg_temp.categoria(el_local, 'Extras', null, null, '➕', 5);
  perform pg_temp.presentacion(c, 'Unidad', 0, null);
  perform pg_temp.producto(c, 'Shot espresso', 'Una carga extra de energía. Extracción perfecta para potenciar cualquier bebida de nuestra carta.', null, 0, '{150000}');
  perform pg_temp.producto(c, 'Leche vegetal', 'Alternativas cremosas para quienes prefieren opciones no lácteas, disponibles en variedades de almendra o avena premium.', null, 1, '{100000}');
end
$$;

drop function pg_temp.producto(uuid, text, text, text, integer, bigint[]);
drop function pg_temp.presentacion(uuid, text, integer, bigint);
drop function pg_temp.categoria(uuid, text, text, text, text, integer);
