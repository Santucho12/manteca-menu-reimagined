export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      acciones_de_cuenta: {
        Row: {
          cuenta_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_uso: string | null
          id: string
          por: string | null
          tipo: string
        }
        Insert: {
          cuenta_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_uso?: string | null
          id?: string
          por?: string | null
          tipo: string
        }
        Update: {
          cuenta_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_uso?: string | null
          id?: string
          por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acciones_de_cuenta_por_fkey"
            columns: ["por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          antes: Json | null
          despues: Json | null
          fecha: string
          id: number
          local_id: string | null
          motivo: string | null
          registro_id: string
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          antes?: Json | null
          despues?: Json | null
          fecha?: string
          id?: never
          local_id?: string | null
          motivo?: string | null
          registro_id: string
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          antes?: Json | null
          despues?: Json | null
          fecha?: string
          id?: never
          local_id?: string | null
          motivo?: string | null
          registro_id?: string
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aumentos: {
        Row: {
          categoria_id: string | null
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          porcentaje: number
          redondeo_centavos: number
          usuario_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          porcentaje: number
          redondeo_centavos: number
          usuario_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          porcentaje?: number
          redondeo_centavos?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aumentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aumentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "aumentos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aumentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      canales_de_venta: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "canales_de_venta_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          foto: string | null
          icono: string
          id: string
          local_id: string
          nombre: string
          orden: number
          subtitulo: string | null
          visible: boolean
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          foto?: string | null
          icono: string
          id?: string
          local_id: string
          nombre: string
          orden: number
          subtitulo?: string | null
          visible?: boolean
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          foto?: string | null
          icono?: string
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          subtitulo?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "categorias_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_de_gasto: {
        Row: {
          activo: boolean
          de_sistema: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          pide_proveedor: boolean
        }
        Insert: {
          activo?: boolean
          de_sistema?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre: string
          pide_proveedor?: boolean
        }
        Update: {
          activo?: boolean
          de_sistema?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          pide_proveedor?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "categorias_de_gasto_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      cierres_de_caja: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          cargado_por: string
          comentario: string | null
          credito_centavos: number
          debito_centavos: number
          efectivo_centavos: number
          fecha: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          fondo_inicial_centavos: number
          id: string
          local_id: string
          motivo_anulacion: string | null
          qr_centavos: number
          queda_en_caja_centavos: number
          transferencia_centavos: number
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          cargado_por?: string
          comentario?: string | null
          credito_centavos?: number
          debito_centavos?: number
          efectivo_centavos: number
          fecha: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fondo_inicial_centavos: number
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          qr_centavos?: number
          queda_en_caja_centavos: number
          transferencia_centavos?: number
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          cargado_por?: string
          comentario?: string | null
          credito_centavos?: number
          debito_centavos?: number
          efectivo_centavos?: number
          fecha?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fondo_inicial_centavos?: number
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          qr_centavos?: number
          queda_en_caja_centavos?: number
          transferencia_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "cierres_de_caja_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_de_caja_cargado_por_fkey"
            columns: ["cargado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_de_caja_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_de_caja: {
        Row: {
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          tolerancia_centavos: number
        }
        Insert: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          tolerancia_centavos?: number
        }
        Update: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          tolerancia_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_de_caja_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: true
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          categoria_id: string
          cierre_id: string | null
          clave: string | null
          comprobante: string | null
          creado_por: string | null
          descripcion: string | null
          fecha: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          id: string
          local_id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          motivo_anulacion: string | null
          por_pagar_id: string | null
          proveedor_id: string | null
          recurrente_id: string | null
          vencimiento: string | null
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id: string
          cierre_id?: string | null
          clave?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          motivo_anulacion?: string | null
          por_pagar_id?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento?: string | null
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id?: string
          cierre_id?: string | null
          clave?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos?: number
          motivo_anulacion?: string | null
          por_pagar_id?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_de_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_id_fkey"
            columns: ["por_pagar_id"]
            isOneToOne: false
            referencedRelation: "gastos_por_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrente_id_fkey"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "gastos_recurrentes"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_por_pagar: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          categoria_id: string
          clave: string | null
          comprobante: string | null
          creado_por: string | null
          descripcion: string | null
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          id: string
          local_id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"] | null
          monto_centavos: number
          motivo_anulacion: string | null
          proveedor_id: string | null
          recurrente_id: string | null
          vencimiento: string
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id: string
          clave?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"] | null
          monto_centavos: number
          motivo_anulacion?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento: string
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          categoria_id?: string
          clave?: string | null
          comprobante?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"] | null
          monto_centavos?: number
          motivo_anulacion?: string | null
          proveedor_id?: string | null
          recurrente_id?: string | null
          vencimiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_por_pagar_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_por_pagar_recurrente_id_fkey"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "gastos_recurrentes"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_recurrentes: {
        Row: {
          activo: boolean
          categoria_id: string
          clave: string | null
          creado_por: string | null
          descripcion: string | null
          fecha_actualizacion: string
          fecha_creacion: string
          frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          generar_desde: string | null
          id: string
          local_id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          primer_vencimiento: string
          proveedor_id: string | null
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          clave?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          generar_desde?: string | null
          id?: string
          local_id?: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          primer_vencimiento: string
          proveedor_id?: string | null
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          clave?: string | null
          creado_por?: string | null
          descripcion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          frecuencia?: Database["public"]["Enums"]["frecuencia_de_gasto"]
          generar_desde?: string | null
          id?: string
          local_id?: string
          medio_de_pago?: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos?: number
          primer_vencimiento?: string
          proveedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_recurrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrentes_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrentes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_recurrentes_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      pagos_de_venta: {
        Row: {
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          medio: Database["public"]["Enums"]["medio_de_caja"]
          monto_centavos: number
          venta_id: string
        }
        Insert: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          medio: Database["public"]["Enums"]["medio_de_caja"]
          monto_centavos: number
          venta_id: string
        }
        Update: {
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          medio?: Database["public"]["Enums"]["medio_de_caja"]
          monto_centavos?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_de_venta_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_de_venta_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          debe_cambiar_contrasena: boolean
          email: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          pendiente: boolean | null
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          activo?: boolean
          debe_cambiar_contrasena?: boolean
          email: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id: string
          local_id: string
          nombre: string
          pendiente?: boolean | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          activo?: boolean
          debe_cambiar_contrasena?: boolean
          email?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          pendiente?: boolean | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      precios: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          monto_centavos: number
          presentacion_id: string
          producto_id: string | null
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          monto_centavos: number
          presentacion_id: string
          producto_id?: string | null
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          monto_centavos?: number
          presentacion_id?: string
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_presentacion_id_fkey"
            columns: ["presentacion_id"]
            isOneToOne: false
            referencedRelation: "presentaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "precios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      presentaciones: {
        Row: {
          activo: boolean
          categoria_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          nombre: string
          orden: number
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentaciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentaciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "presentaciones_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          categoria_id: string
          descripcion: string | null
          etiqueta: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          orden: number
          visible: boolean
        }
        Insert: {
          activo?: boolean
          categoria_id: string
          descripcion?: string | null
          etiqueta?: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          nombre: string
          orden: number
          visible?: boolean
        }
        Update: {
          activo?: boolean
          categoria_id?: string
          descripcion?: string | null
          etiqueta?: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "productos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          nombre: string
          observaciones: string | null
          que_compra: string | null
          telefono: string | null
          ubicacion: string | null
        }
        Insert: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre: string
          observaciones?: string | null
          que_compra?: string | null
          telefono?: string | null
          ubicacion?: string | null
        }
        Update: {
          activo?: boolean
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          nombre?: string
          observaciones?: string | null
          que_compra?: string | null
          telefono?: string | null
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      renglones_de_venta: {
        Row: {
          cantidad: number
          descripcion: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          precio_unitario_centavos: number
          presentacion_id: string | null
          producto_id: string | null
          subtotal_centavos: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          descripcion: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          precio_unitario_centavos: number
          presentacion_id?: string | null
          producto_id?: string | null
          subtotal_centavos: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          descripcion?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          precio_unitario_centavos?: number
          presentacion_id?: string | null
          producto_id?: string | null
          subtotal_centavos?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renglones_de_venta_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_venta_presentacion_id_fkey"
            columns: ["presentacion_id"]
            isOneToOne: false
            referencedRelation: "presentaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_venta_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "menu_publico"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "renglones_de_venta_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renglones_de_venta_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      retiros_de_caja: {
        Row: {
          cierre_id: string
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          local_id: string
          monto_centavos: number
          quien: string
        }
        Insert: {
          cierre_id: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id: string
          monto_centavos: number
          quien: string
        }
        Update: {
          cierre_id?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          local_id?: string
          monto_centavos?: number
          quien?: string
        }
        Relationships: [
          {
            foreignKeyName: "retiros_de_caja_cierre_id_fkey"
            columns: ["cierre_id"]
            isOneToOne: false
            referencedRelation: "cierres_de_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retiros_de_caja_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          anulado: boolean
          anulado_por: string | null
          canal_id: string | null
          cerrada_en: string | null
          clave: string | null
          comentario: string | null
          creado_por: string | null
          estado: Database["public"]["Enums"]["estado_de_venta"]
          fecha: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_creacion: string
          fudo_id: string | null
          id: string
          local_id: string
          motivo_anulacion: string | null
          origen: Database["public"]["Enums"]["origen_de_venta"]
          total_centavos: number
        }
        Insert: {
          anulado?: boolean
          anulado_por?: string | null
          canal_id?: string | null
          cerrada_en?: string | null
          clave?: string | null
          comentario?: string | null
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_de_venta"]
          fecha: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fudo_id?: string | null
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          origen?: Database["public"]["Enums"]["origen_de_venta"]
          total_centavos: number
        }
        Update: {
          anulado?: boolean
          anulado_por?: string | null
          canal_id?: string | null
          cerrada_en?: string | null
          clave?: string | null
          comentario?: string | null
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_de_venta"]
          fecha?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_creacion?: string
          fudo_id?: string | null
          id?: string
          local_id?: string
          motivo_anulacion?: string | null
          origen?: Database["public"]["Enums"]["origen_de_venta"]
          total_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canales_de_venta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      menu_publico: {
        Row: {
          categoria: string | null
          categoria_id: string | null
          compartidos: Json | null
          descripcion: string | null
          etiqueta: Database["public"]["Enums"]["etiqueta_de_producto"] | null
          foto: string | null
          icono: string | null
          nombre: string | null
          orden: number | null
          orden_categoria: number | null
          precios: Json | null
          producto_id: string | null
          subtitulo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cierres_con_resultado: {
        Args: { desde: string; hasta: string; persona?: string }
        Returns: {
          anulado: boolean
          cargado_por: string
          comentario: string
          credito_centavos: number
          debito_centavos: number
          efectivo_centavos: number
          fecha: string
          fondo_inicial_centavos: number
          gastos_centavos: number
          id: string
          motivo_anulacion: string
          persona_nombre: string
          qr_centavos: number
          queda_en_caja_centavos: number
          retiros_centavos: number
          tolerancia_centavos: number
          transferencia_centavos: number
          ventas_credito_centavos: number
          ventas_debito_centavos: number
          ventas_efectivo_centavos: number
          ventas_qr_centavos: number
          ventas_transferencia_centavos: number
        }[]
      }
      cierres_editar: {
        Args: { datos: Json; el_id: string }
        Returns: undefined
      }
      cierres_exigir_quien_carga: { Args: never; Returns: undefined }
      cierres_fecha_del_fondo: { Args: { la_fecha: string }; Returns: string }
      cierres_fondo_sugerido: { Args: { la_fecha: string }; Returns: number }
      cierres_fondos_anteriores: {
        Args: { ids: string[] }
        Returns: {
          fondo_anterior_centavos: number
          id: string
        }[]
      }
      cierres_guardar: { Args: { datos: Json }; Returns: string }
      cierres_insertar: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      es_admin_activo: { Args: never; Returns: boolean }
      es_caja_activa: { Args: never; Returns: boolean }
      es_vencimiento_del_fijo: {
        Args: {
          el_dia: string
          la_frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          primero: string
        }
        Returns: boolean
      }
      gastos_exigir_medio: {
        Args: { anterior: string; nuevo: string }
        Returns: undefined
      }
      gastos_pagado_por_proveedor: {
        Args: { desde: string; hasta: string }
        Returns: {
          proveedor_id: string
          total_centavos: number
        }[]
      }
      gastos_total: {
        Args: {
          desde: string
          el_proveedor?: string
          el_tipo?: string
          hasta: string
          la_categoria?: string
        }
        Returns: number
      }
      gastos_validar_categoria_y_proveedor: {
        Args: {
          el_local: string
          el_proveedor: string
          la_categoria: string
          proveedor_anterior: string
        }
        Returns: undefined
      }
      generar_gastos_recurrentes: { Args: { hasta: string }; Returns: number }
      generar_por_pagar: {
        Args: { el_fijo?: string; hasta: string }
        Returns: number
      }
      local_del_usuario: { Args: never; Returns: string }
      menu_aplicar_aumento: { Args: { datos: Json }; Returns: string }
      menu_aumento_vigente: {
        Args: { el_local: string; la_categoria: string; recibidos: Json }
        Returns: boolean
      }
      menu_cambiar_visibilidad: {
        Args: { el_id: string; el_tipo: string; mostrar: boolean }
        Returns: undefined
      }
      menu_desactivar: {
        Args: { el_id: string; el_tipo: string }
        Returns: undefined
      }
      menu_escribir_categoria: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      menu_escribir_precios_del_producto: {
        Args: { el_local: string; el_producto: string; lista: Json }
        Returns: undefined
      }
      menu_escribir_presentaciones: {
        Args: { el_local: string; la_categoria: string; lista: Json }
        Returns: undefined
      }
      menu_escribir_producto: {
        Args: { datos: Json; el_local: string }
        Returns: string
      }
      menu_exigir_admin: { Args: never; Returns: string }
      menu_guardar_categoria: {
        Args: { confirmar?: boolean; datos: Json }
        Returns: Json
      }
      menu_guardar_producto: {
        Args: { confirmar?: boolean; datos: Json }
        Returns: Json
      }
      menu_intercambiar_orden: {
        Args: { el_tipo: string; otro: string; uno: string }
        Returns: undefined
      }
      menu_mover: {
        Args: { direccion: string; el_id: string; el_tipo: string }
        Returns: undefined
      }
      menu_no_encontrado: { Args: never; Returns: undefined }
      menu_ocultar_sin_precio: {
        Args: { confirmar: boolean; las_categorias: string[] }
        Returns: Json
      }
      menu_poner_precio: {
        Args: {
          el_local: string
          el_producto: string
          la_presentacion: string
          monto: number
        }
        Returns: undefined
      }
      menu_precios_del_alcance: {
        Args: { el_local: string; la_categoria: string }
        Returns: {
          id: string
          monto_centavos: number
        }[]
      }
      menu_reactivar: {
        Args: { el_id: string; el_tipo: string }
        Returns: undefined
      }
      menu_validar_foto: {
        Args: { el_local: string; la_foto: string }
        Returns: string
      }
      menu_vecino: {
        Args: { direccion: string; el_id: string; el_tipo: string }
        Returns: string
      }
      pagos_pendientes: {
        Args: never
        Returns: {
          categoria: string
          descripcion: string
          frecuencia: Database["public"]["Enums"]["frecuencia_de_gasto"]
          id: string
          medio_de_pago: Database["public"]["Enums"]["medio_de_pago"]
          monto_centavos: number
          proveedor: string
          recurrente_id: string
          vencimiento: string
        }[]
      }
      registrar_cambio_de_contrasena: {
        Args: { cuenta: string; por: string; tipo: string }
        Returns: undefined
      }
      reporte_gastos: {
        Args: { desde: string; hasta: string }
        Returns: {
          categoria: string
          categoria_id: string
          dia: string
          monto_centavos: number
        }[]
      }
      reporte_ventas_por_categoria: {
        Args: { desde: string; hasta: string }
        Returns: {
          categoria: string
          categoria_id: string
          monto_centavos: number
          ventas: number
        }[]
      }
      reporte_ventas_por_dia: {
        Args: { desde: string; hasta: string }
        Returns: {
          dia: string
          monto_centavos: number
          ventas: number
        }[]
      }
      reporte_ventas_por_producto: {
        Args: { desde: string; hasta: string }
        Returns: {
          cantidad: number
          categoria: string
          categoria_id: string
          monto_centavos: number
          presentacion: string
          producto: string
          producto_id: string
        }[]
      }
      reportes_exigir_admin: { Args: never; Returns: undefined }
      rol_de_cuenta_nueva: {
        Args: { cuentas: number }
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      tiene_precio: { Args: { el_producto: string }; Returns: boolean }
      usar_accion: {
        Args: { cuenta: string; tipos: string[] }
        Returns: Record<string, unknown>
      }
      ventas_aplicar_lote: {
        Args: { el_local: string; lote: Json }
        Returns: number[]
      }
      ventas_borrar_canal: { Args: { el_canal: string }; Returns: undefined }
      ventas_crear_del_excel: {
        Args: {
          el_local: string
          el_medio: Database["public"]["Enums"]["medio_de_caja"]
          el_monto: number
          la_fecha: string
        }
        Returns: undefined
      }
      ventas_guardar_manual: { Args: { datos: Json }; Returns: string }
      ventas_importar_excel: { Args: { lotes: Json }; Returns: Json }
      ventas_totales: {
        Args: {
          desde: string
          el_medio?: string
          el_origen?: string
          hasta: string
        }
        Returns: {
          anuladas: number
          anulado_centavos: number
          canceladas: number
          cancelado_centavos: number
          cobradas: number
          cobrado_centavos: number
        }[]
      }
      ventas_validar_excel: { Args: { lotes: Json }; Returns: undefined }
      ventas_validar_manual: {
        Args: { datos: Json; el_local: string }
        Returns: undefined
      }
    }
    Enums: {
      estado_de_venta: "cerrada" | "cancelada" | "en_curso"
      etiqueta_de_producto: "mas_vendido" | "artesanal" | "nuevo"
      frecuencia_de_gasto: "mensual" | "bimestral" | "anual"
      medio_de_caja: "efectivo" | "credito" | "debito" | "qr" | "transferencia"
      medio_de_pago: "efectivo_caja" | "transferencia" | "tarjeta" | "otro"
      origen_de_venta: "manual" | "fudo"
      rol_usuario: "invitado" | "caja" | "encargado" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_de_venta: ["cerrada", "cancelada", "en_curso"],
      etiqueta_de_producto: ["mas_vendido", "artesanal", "nuevo"],
      frecuencia_de_gasto: ["mensual", "bimestral", "anual"],
      medio_de_caja: ["efectivo", "credito", "debito", "qr", "transferencia"],
      medio_de_pago: ["efectivo_caja", "transferencia", "tarjeta", "otro"],
      origen_de_venta: ["manual", "fudo"],
      rol_usuario: ["invitado", "caja", "encargado", "admin"],
    },
  },
} as const
