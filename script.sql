-- MySQL Script generated by MySQL Workbench
-- Sun Nov 17 20:18:30 2024
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema bd_jamb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema bd_jamb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `bd_jamb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `bd_jamb` ;

-- -----------------------------------------------------
-- Table `bd_jamb`.`clientes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`clientes` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_cliente`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`proveedores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`proveedores` (
  `id_proveedor` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `contacto` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(15) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_proveedor`))
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`compras`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`compras` (
  `id_compra` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `proveedor_id` INT NOT NULL,
  `tipo_pago` ENUM('contado', 'credito', 'mixta') NOT NULL,
  `saldo_pendiente` DECIMAL(10,2) NULL DEFAULT '0.00',
  `costo_total` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_compra`),
  INDEX `proveedor_id` (`proveedor_id` ASC) VISIBLE,
  CONSTRAINT `compras_ibfk_1`
    FOREIGN KEY (`proveedor_id`)
    REFERENCES `bd_jamb`.`proveedores` (`id_proveedor`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`ventas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`ventas` (
  `id_venta` INT NOT NULL AUTO_INCREMENT,
  `cliente_id` INT NOT NULL,
  `tipo_pago` VARCHAR(20) NOT NULL,
  `delivery` DECIMAL(10,2) NULL DEFAULT NULL,
  `envio` DECIMAL(10,2) NULL DEFAULT NULL,
  `comision_facturacion` DECIMAL(10,2) NULL DEFAULT NULL,
  `saldo_pendiente` DECIMAL(10,2) NULL DEFAULT '0.00',
  `saldo_a_favor` DECIMAL(10,2) NULL DEFAULT '0.00',
  `ingreso_total` DECIMAL(10,2) NOT NULL,
  `fecha_venta` DATE NOT NULL,
  `total_venta` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_venta`),
  INDEX `cliente_id` (`cliente_id` ASC) VISIBLE,
  CONSTRAINT `ventas_ibfk_1`
    FOREIGN KEY (`cliente_id`)
    REFERENCES `bd_jamb`.`clientes` (`id_cliente`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`cuentas_por_cobrar`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`cuentas_por_cobrar` (
  `id_cuenta` INT NOT NULL AUTO_INCREMENT,
  `id_venta` INT NOT NULL,
  `cliente_id` INT NOT NULL,
  `monto_total` DECIMAL(10,2) NOT NULL,
  `saldo_pendiente` DECIMAL(10,2) NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `estado` ENUM('pagado', 'pendiente', 'parcial') NOT NULL,
  PRIMARY KEY (`id_cuenta`),
  INDEX `id_venta` (`id_venta` ASC) VISIBLE,
  INDEX `cliente_id` (`cliente_id` ASC) VISIBLE,
  CONSTRAINT `cuentas_por_cobrar_ibfk_1`
    FOREIGN KEY (`id_venta`)
    REFERENCES `bd_jamb`.`ventas` (`id_venta`),
  CONSTRAINT `cuentas_por_cobrar_ibfk_2`
    FOREIGN KEY (`cliente_id`)
    REFERENCES `bd_jamb`.`clientes` (`id_cliente`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`cuentas_por_pagar`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`cuentas_por_pagar` (
  `id_cuenta` INT NOT NULL AUTO_INCREMENT,
  `id_compra` INT NOT NULL,
  `proveedor_id` INT NOT NULL,
  `monto_total` DECIMAL(10,2) NOT NULL,
  `saldo_pendiente` DECIMAL(10,2) NOT NULL,
  `fecha_vencimiento` DATE NOT NULL,
  `estado` ENUM('pagado', 'pendiente', 'parcial') NOT NULL,
  PRIMARY KEY (`id_cuenta`),
  INDEX `id_compra` (`id_compra` ASC) VISIBLE,
  INDEX `proveedor_id` (`proveedor_id` ASC) VISIBLE,
  CONSTRAINT `cuentas_por_pagar_ibfk_1`
    FOREIGN KEY (`id_compra`)
    REFERENCES `bd_jamb`.`compras` (`id_compra`),
  CONSTRAINT `cuentas_por_pagar_ibfk_2`
    FOREIGN KEY (`proveedor_id`)
    REFERENCES `bd_jamb`.`proveedores` (`id_proveedor`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`detalles_compra`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`detalles_compra` (
  `id_detalle_compra` INT NOT NULL AUTO_INCREMENT,
  `id_compra` INT NOT NULL,
  `modelo` VARCHAR(100) NOT NULL,
  `capacidad` INT NOT NULL,
  `costo` DECIMAL(10,2) NOT NULL,
  `color` VARCHAR(50) NULL DEFAULT NULL,
  `cantidad` INT NOT NULL,
  `lista_blanca` TINYINT(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id_detalle_compra`),
  INDEX `id_compra` (`id_compra` ASC) VISIBLE,
  CONSTRAINT `detalles_compra_ibfk_1`
    FOREIGN KEY (`id_compra`)
    REFERENCES `bd_jamb`.`compras` (`id_compra`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`detalles_venta`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`detalles_venta` (
  `id_detalle_venta` INT NOT NULL AUTO_INCREMENT,
  `id_venta` INT NOT NULL,
  `modelo` VARCHAR(100) NOT NULL,
  `capacidad` INT NOT NULL,
  `precio_venta` DECIMAL(10,2) NOT NULL,
  `costo` DECIMAL(10,2) NOT NULL,
  `cantidad` INT NOT NULL,
  PRIMARY KEY (`id_detalle_venta`),
  INDEX `id_venta` (`id_venta` ASC) VISIBLE,
  CONSTRAINT `detalles_venta_ibfk_1`
    FOREIGN KEY (`id_venta`)
    REFERENCES `bd_jamb`.`ventas` (`id_venta`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`inventario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`inventario` (
  `id_inventario` INT NOT NULL AUTO_INCREMENT,
  `modelo` VARCHAR(100) NOT NULL,
  `capacidad` VARCHAR(50) NOT NULL,
  `color` VARCHAR(50) NULL DEFAULT NULL,
  `cantidad` INT NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_inventario`),
  UNIQUE INDEX `modelo` (`modelo` ASC, `capacidad` ASC, `color` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`imei`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`imei` (
  `id_imei` INT NOT NULL AUTO_INCREMENT,
  `id_inventario` INT NULL DEFAULT NULL,
  `imei` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id_imei`),
  INDEX `id_inventario` (`id_inventario` ASC) VISIBLE,
  CONSTRAINT `imei_ibfk_1`
    FOREIGN KEY (`id_inventario`)
    REFERENCES `bd_jamb`.`inventario` (`id_inventario`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`imei_detalles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`imei_detalles` (
  `id_imei` INT NOT NULL AUTO_INCREMENT,
  `id_detalle_compra` INT NOT NULL,
  `imei_serie` VARCHAR(20) NOT NULL,
  `fecha_compra` DATE NOT NULL,
  PRIMARY KEY (`id_imei`),
  INDEX `id_detalle_compra` (`id_detalle_compra` ASC) VISIBLE,
  CONSTRAINT `imei_detalles_ibfk_1`
    FOREIGN KEY (`id_detalle_compra`)
    REFERENCES `bd_jamb`.`detalles_compra` (`id_detalle_compra`))
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`movimientos_inventario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`movimientos_inventario` (
  `id_movimiento` INT NOT NULL AUTO_INCREMENT,
  `id_inventario` INT NOT NULL,
  `tipo_movimiento` ENUM('ingreso', 'salida') NOT NULL,
  `cantidad` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `detalle` VARCHAR(255) NULL DEFAULT NULL,
  `id_compra` INT NULL DEFAULT NULL,
  `id_venta` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_movimiento`),
  INDEX `id_inventario` (`id_inventario` ASC) VISIBLE,
  INDEX `id_compra` (`id_compra` ASC) VISIBLE,
  INDEX `id_venta` (`id_venta` ASC) VISIBLE,
  CONSTRAINT `movimientos_inventario_ibfk_1`
    FOREIGN KEY (`id_inventario`)
    REFERENCES `bd_jamb`.`inventario` (`id_inventario`),
  CONSTRAINT `movimientos_inventario_ibfk_2`
    FOREIGN KEY (`id_compra`)
    REFERENCES `bd_jamb`.`compras` (`id_compra`),
  CONSTRAINT `movimientos_inventario_ibfk_3`
    FOREIGN KEY (`id_venta`)
    REFERENCES `bd_jamb`.`ventas` (`id_venta`))
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `bd_jamb`.`ventas_imei`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bd_jamb`.`ventas_imei` (
  `id_venta_imei` INT NOT NULL AUTO_INCREMENT,
  `id_imei` INT NULL DEFAULT NULL,
  `fecha_venta` DATE NULL DEFAULT NULL,
  `id_venta` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id_venta_imei`),
  INDEX `id_imei` (`id_imei` ASC) VISIBLE,
  INDEX `id_venta` (`id_venta` ASC) VISIBLE,
  CONSTRAINT `ventas_imei_ibfk_1`
    FOREIGN KEY (`id_imei`)
    REFERENCES `bd_jamb`.`imei` (`id_imei`)
    ON DELETE CASCADE,
  CONSTRAINT `ventas_imei_ibfk_2`
    FOREIGN KEY (`id_venta`)
    REFERENCES `bd_jamb`.`ventas` (`id_venta`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

USE `bd_jamb`;

DELIMITER $$
USE `bd_jamb`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `bd_jamb`.`after_insert_detalle_compra`
AFTER INSERT ON `bd_jamb`.`detalles_compra`
FOR EACH ROW
BEGIN
    DECLARE total DECIMAL(10, 2);
    
    -- Calcular el total de la compra
    SELECT SUM(costo * cantidad) INTO total
    FROM detalles_compra
    WHERE id_compra = NEW.id_compra;
    
    -- Actualizar el costo total en la tabla compras
    UPDATE compras
    SET costo_total = total
    WHERE id_compra = NEW.id_compra;
END$$


DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
