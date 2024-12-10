import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Forms } from "./Forms";
import { Many } from "drizzle-orm";
import { Questions } from "./Questions";
import { Documents } from "./Documents";

@Entity()
export class Citations {
    @PrimaryGeneratedColumn()
    citation_id!: string;

    @ManyToOne(() => Forms)
    @Column('int')
    form_id: number;

    @ManyToOne(() => Questions)
    @Column('int')
    question_id: number;

    @ManyToOne(() => Documents)
    @Column('int')
    document_id: number;

    @Column('text')
    excerpt!: string;

    @Column('json')
    bounds: JSON;

    @Column('int', {default: 0})
    review: number = 0;

    @Column('text')
    creator!: string;

    @CreateDateColumn('datetime')
    created_at!: Date;

    @UpdateDateColumn('datetime')
    modified_at!: Date;
}