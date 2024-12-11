import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'events',
    schema: 'dbo'
})
export class Events {
    @PrimaryGeneratedColumn()
    event_id!: number;

    @Column('simple-json')
    body!: JSON;

    @CreateDateColumn()
    created_at!: Date;
}