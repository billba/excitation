import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Events {
    @PrimaryGeneratedColumn()
    event_id!: number;

    @Column('json')
    body!: JSON;

    @CreateDateColumn('datetime')
    created_at!: Date;
}